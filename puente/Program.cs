// Puente: lee el Polar (emparejado en Windows) por BLE y envia los datos al API.
//  - Frecuencia cardiaca (+ intervalos RR): servicio estandar Heart Rate (0x180D / 0x2A37)
//  - Acelerometro, giroscopio, magnetometro, PPG y PPI: servicio PMD de Polar (formato segun polar-ble-sdk)
// Que datos se miden lo elige la pagina al iniciar la sesion; el puente consulta al servidor cada segundo.
// El puente SOLO recolecta y reenvia datos en bruto: no promedia, no estima, no corrige (eso se hace en el backend).
// Uso: puente-polar.exe [url] [nombre]      (por defecto http://localhost:3000 y "Polar")
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Devices.Enumeration;
using Windows.Storage.Streams;

string baseUrl = args.FirstOrDefault(a => a.StartsWith("http")) ?? "http://localhost:3000";
string filtro = args.Where(a => !a.StartsWith("http")).Skip(1).FirstOrDefault() ?? "Polar";
const string PMD = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";

// clave de la pagina -> (tipo PMD, nombre del arreglo en el JSON)
var PMDS = new Dictionary<string, (int tipo, string json)> {
  ["acc"] = (2, "acelerometro"), ["gyro"] = (5, "giroscopio"), ["mag"] = (6, "magnetometro"), ["ppg"] = (1, "ppg"), ["ppi"] = (3, "ppi") };
var TIPOS = PMDS.ToDictionary(k => k.Value.tipo, k => k.Key);

object lk = new();
var pend = PMDS.Keys.ToDictionary(k => k, _ => new List<Dictionary<string, object>>());
var hrPend = new List<byte[]>();
double? offsetMs = null;                       // reloj PC - reloj del sensor (se fija con el primer paquete de la sesion)
var prevNs = new Dictionary<int, ulong>();
var factor = new Dictionary<int, double>();
var rate = new Dictionary<int, double>();
var activos = new HashSet<string>();           // flujos PMD en marcha
var avisados = new HashSet<string>();
var esperas = new ConcurrentDictionary<string, TaskCompletionSource<byte[]>>();
bool midiendo = false; string sesionId = null; string[] seleccion = Array.Empty<string>();

static byte[] Leer(IBuffer buf) { var r = DataReader.FromBuffer(buf); var b = new byte[buf.Length]; r.ReadBytes(b); return b; }
static string Iso(double ms) => DateTimeOffset.FromUnixTimeMilliseconds((long)Math.Round(ms)).UtcDateTime.ToString("o");
void Avisar(string clave, string msg) { if (avisados.Add(clave + msg)) Console.WriteLine($"AVISO [{clave}]: {msg}"); }

// ------------------------------------------------------------------ conexion BLE
var devs = await DeviceInformation.FindAllAsync(BluetoothLEDevice.GetDeviceSelectorFromPairingState(true));
var info = devs.FirstOrDefault(d => d.Name.Contains(filtro, StringComparison.OrdinalIgnoreCase));
if (info == null) { Console.WriteLine($"No hay dispositivo BLE emparejado con nombre '*{filtro}*'"); return; }
string mac = (info.Id.Contains('-') ? info.Id[(info.Id.LastIndexOf('-') + 1)..] : "desconocida").ToUpperInvariant();
Console.WriteLine($"Conectando a {info.Name} ({mac})...");
var dev = await BluetoothLEDevice.FromIdAsync(info.Id);

async Task<GattCharacteristic> Car(string svc, string chr) {
  string ultimo = "";
  for (int intento = 1; intento <= 20; intento++) {          // tras reiniciar, Windows tarda en soltar el sensor (AccessDenied)
    var s = await dev.GetGattServicesForUuidAsync(Guid.Parse(svc), BluetoothCacheMode.Uncached);
    if (s.Status == GattCommunicationStatus.Success && s.Services.Count > 0) {
      var c = await s.Services[0].GetCharacteristicsForUuidAsync(Guid.Parse(chr), BluetoothCacheMode.Uncached);
      if (c.Status == GattCommunicationStatus.Success && c.Characteristics.Count > 0) return c.Characteristics[0];
      ultimo = $"caracteristica {chr}: {c.Status}";
    } else ultimo = $"servicio {svc}: {s.Status}";
    if (intento == 1) Console.WriteLine($"Esperando al sensor ({ultimo}); reintentando...");
    await Task.Delay(3000);
  }
  throw new Exception($"No se pudo acceder al sensor ({ultimo}). Despiertalo / ponlo en la piel.");
}

var hrChr = await Car("0000180d-0000-1000-8000-00805f9b34fb", "00002a37-0000-1000-8000-00805f9b34fb");
hrChr.ValueChanged += (_, a) => { var b = Leer(a.CharacteristicValue); lock (lk) { if (midiendo && seleccion.Contains("fc")) hrPend.Add(b); } };

GattCharacteristic ctrl = null, data = null;
try {
  ctrl = await Car(PMD, "fb005c81-02e7-f387-1cad-8acd2d8df0c8");
  data = await Car(PMD, "fb005c82-02e7-f387-1cad-8acd2d8df0c8");
} catch (Exception e) { Console.WriteLine($"AVISO: sin servicio PMD, solo frecuencia cardiaca -> {e.Message}"); }

// ------------------------------------------------------------------ protocolo PMD
static long Firmado(byte[] b, int o, int n) {
  long v = 0; for (int i = 0; i < n; i++) v |= (long)b[o + i] << (8 * i);
  long signo = 1L << (8 * n - 1); return (v & signo) != 0 ? v - (signo << 1) : v;
}

// Trama comprimida: muestra de referencia (ch canales x refBytes) + bloques [ancho_bits][n][deltas empaquetados LSB-first]
static List<long[]> Delta(byte[] b, int pos, int ch, int refBytes) {
  var res = new List<long[]>();
  if (pos + ch * refBytes > b.Length) return res;
  var prev = new long[ch];
  for (int k = 0; k < ch; k++) prev[k] = Firmado(b, pos + k * refBytes, refBytes);
  pos += ch * refBytes;
  res.Add((long[])prev.Clone());
  while (pos + 2 <= b.Length) {
    int w = b[pos], n = b[pos + 1]; pos += 2;
    int nb = (n * ch * w + 7) / 8; if (pos + nb > b.Length) break;
    int bit = 0;
    for (int m = 0; m < n; m++) {
      for (int k = 0; k < ch; k++) {
        long v = 0;
        for (int j = 0; j < w; j++, bit++) if (((b[pos + bit / 8] >> (bit % 8)) & 1) != 0) v |= 1L << j;
        if (w > 0 && (v & (1L << (w - 1))) != 0) v -= 1L << w;
        prev[k] += v;
      }
      res.Add((long[])prev.Clone());
    }
    pos += nb;
  }
  return res;
}

static Dictionary<int, List<long>> Ajustes(byte[] r, int pos) {       // [tipo][n][n valores]
  var d = new Dictionary<int, List<long>>();
  while (pos + 2 <= r.Length) {
    int t = r[pos++], cnt = r[pos++];
    int sz = t switch { 0 => 2, 1 => 2, 2 => 2, 3 => 4, 4 => 1, 5 => 4, 6 => 16, _ => -1 };
    if (sz < 0) break;
    var l = new List<long>();
    for (int k = 0; k < cnt && pos + sz <= r.Length; k++) {
      long v = 0; for (int j = 0; j < Math.Min(sz, 8); j++) v |= (long)r[pos + j] << (8 * j);
      l.Add(v); pos += sz;
    }
    d[t] = l;
  }
  return d;
}

async Task<byte[]> Cmd(byte[] c, int timeoutMs = 6000) {
  string clave = $"{c[0]}:{c[1] & 0x3F}";
  var tcs = new TaskCompletionSource<byte[]>(TaskCreationOptions.RunContinuationsAsynchronously);
  esperas[clave] = tcs;
  var w = new DataWriter(); w.WriteBytes(c);
  var ws = await ctrl.WriteValueAsync(w.DetachBuffer(), GattWriteOption.WriteWithResponse);
  if (ws != GattCommunicationStatus.Success) { esperas.TryRemove(clave, out _); throw new Exception($"escritura al sensor: {ws}"); }
  if (await Task.WhenAny(tcs.Task, Task.Delay(timeoutMs)) != tcs.Task) { esperas.TryRemove(clave, out _); throw new Exception("el sensor no respondio"); }
  return tcs.Task.Result;
}

async Task IniciarFlujo(string clave) {
  int t = PMDS[clave].tipo;
  var cmd = new List<byte> { 0x02, (byte)t };
  double fs = 52;
  if (t != 3) {                                                          // PPI no tiene ajustes
    var r = await Cmd(new byte[] { 0x01, (byte)t });
    if (r.Length < 5 || r[3] != 0) throw new Exception($"este sensor no ofrece este dato (codigo {(r.Length > 3 ? r[3] : -1)})");
    var st = Ajustes(r, 5);
    foreach (var (id, sz) in new[] { (0, 2), (1, 2), (2, 2), (4, 1) }) {  // frecuencia, resolucion, rango, canales: el maximo disponible
      if (!st.TryGetValue(id, out var vs) || vs.Count == 0) continue;
      long v = vs.Max();
      cmd.Add((byte)id); cmd.Add(1);
      for (int i = 0; i < sz; i++) cmd.Add((byte)(v >> (8 * i)));
      if (id == 0) fs = v;
    }
  }
  var rs = await Cmd(cmd.ToArray());
  if (rs.Length < 4 || rs[3] != 0) throw new Exception($"el sensor rechazo iniciarlo (codigo {(rs.Length > 3 ? rs[3] : -1)})");
  factor[t] = 1.0;
  if (rs.Length > 5) { var p = Ajustes(rs, 5); if (p.TryGetValue(5, out var f) && f.Count > 0) factor[t] = BitConverter.Int32BitsToSingle((int)(uint)f[0]); }
  rate[t] = fs; prevNs.Remove(t); activos.Add(clave);
  Console.WriteLine($"  {clave}: activo ({(t == 3 ? "por pulso" : fs + " Hz")}, factor {factor[t]})");
}

void Procesar(byte[] b) {
  if (b.Length < 10) return;
  int t = b[0] & 0x3F;
  if (!TIPOS.TryGetValue(t, out var clave)) return;
  lock (lk) { if (!midiendo || !seleccion.Contains(clave)) return; }
  bool comp = (b[9] & 0x80) != 0; int ft = b[9] & 0x7F;
  double f = factor.TryGetValue(t, out var ff) ? ff : 1.0;
  ulong ns = BitConverter.ToUInt64(b, 1);                   // ns desde 2000-01-01; es el instante de la ULTIMA muestra
  double sensorMs = 946684800000.0 + ns / 1e6;
  lock (lk) { offsetMs ??= DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - sensorMs; }
  double off = offsetMs.Value;

  if (clave == "ppi") {
    if (comp || ft != 0) { Avisar(clave, $"formato PPI no soportado (frame 0x{b[9]:X2})"); return; }
    int n = (b.Length - 10) / 6; var arr = new Dictionary<string, object>[n];
    double tt = ns == 0 ? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() : sensorMs + off;   // el PPI del Verity Sense suele traer hora 0
    double tFin = tt;
    for (int i = n - 1; i >= 0; i--) {
      int o = 10 + i * 6, fl = b[o + 5], pp = BitConverter.ToUInt16(b, o + 1);
      arr[i] = new() { ["timestamp"] = Iso(tt), ["pp_ms"] = pp, ["error_ms"] = (int)BitConverter.ToUInt16(b, o + 3), ["hr"] = (int)b[o],
        ["contacto_piel"] = (fl >> 1) & 1, ["bloqueado"] = fl & 1, ["sensor_ns"] = ns == 0 ? "0" : ((long)ns - (long)((tFin - tt) * 1e6)).ToString() };
      tt -= pp;
    }
    lock (lk) pend[clave].AddRange(arr);
    return;
  }

  var filas = new List<double[]>();                         // una fila por muestra, ya en su unidad final
  double Esc(double v) => f != 1.0 ? v * f : v;
  switch (clave) {
    case "acc":
      if (comp) { foreach (var m in Delta(b, 10, 3, 2)) filas.Add(m.Select(v => ft == 0 ? v * f * 1000.0 : Esc(v)).ToArray()); }
      else { int sz = ft == 0 ? 1 : ft == 1 ? 2 : 3; for (int p = 10; p + 3 * sz <= b.Length; p += 3 * sz) filas.Add(new[] { (double)Firmado(b, p, sz), Firmado(b, p + sz, sz), Firmado(b, p + 2 * sz, sz) }); }
      break;
    case "gyro":
      if (comp && ft == 0) foreach (var m in Delta(b, 10, 3, 2)) filas.Add(m.Select(v => Esc(v)).ToArray());
      else { Avisar(clave, $"formato de giroscopio no soportado (frame 0x{b[9]:X2})"); return; }
      break;
    case "mag":
      if (comp && ft == 0) foreach (var m in Delta(b, 10, 3, 2)) filas.Add(m.Select(v => Esc(v)).ToArray());
      else if (comp && ft == 1) foreach (var m in Delta(b, 10, 4, 2)) filas.Add(new[] { m[0] * f / 1000.0, m[1] * f / 1000.0, m[2] * f / 1000.0, (double)m[3] });
      else { Avisar(clave, $"formato de magnetometro no soportado (frame 0x{b[9]:X2})"); return; }
      break;
    case "ppg":
      if (comp && ft == 0) foreach (var m in Delta(b, 10, 4, 3)) filas.Add(m.Select(v => Math.Truncate(Esc(v))).ToArray());
      else if (!comp && ft == 0) { for (int p = 10; p + 12 <= b.Length; p += 12) filas.Add(new[] { (double)Firmado(b, p, 3), Firmado(b, p + 3, 3), Firmado(b, p + 6, 3), Firmado(b, p + 9, 3) }); }
      else { Avisar(clave, $"formato de PPG no soportado (frame 0x{b[9]:X2})"); return; }
      break;
  }
  int cnt = filas.Count; if (cnt == 0) return;
  // separacion real entre muestras = tiempo entre paquetes / muestras del paquete (el reloj del sensor no es exactamente la frecuencia nominal)
  double nominal = 1000.0 / (rate.TryGetValue(t, out var rr) && rr > 0 ? rr : 52.0);
  double paso = prevNs.TryGetValue(t, out var pv) && ns > pv ? (ns - pv) / 1e6 / cnt : nominal;
  if (paso < nominal * 0.5 || paso > nominal * 2) paso = nominal;
  prevNs[t] = ns;
  var lista = new List<Dictionary<string, object>>(cnt);
  for (int i = 0; i < cnt; i++) {
    double atras = (cnt - 1 - i) * paso; var v = filas[i];
    var o = new Dictionary<string, object> { ["timestamp"] = Iso(sensorMs + off - atras) };
    if (clave == "ppg") { o["ppg0"] = v[0]; o["ppg1"] = v[1]; o["ppg2"] = v[2]; o["ambiente"] = v[3]; }
    else { o["x"] = v[0]; o["y"] = v[1]; o["z"] = v[2]; if (clave == "mag" && v.Length > 3) o["calibracion"] = v[3]; }
    o["sensor_ns"] = ((long)ns - (long)Math.Round(atras * 1e6)).ToString();
    lista.Add(o);
  }
  lock (lk) pend[clave].AddRange(lista);
}

if (ctrl != null && data != null) {
  ctrl.ValueChanged += (_, a) => {
    var b = Leer(a.CharacteristicValue);
    if (b.Length >= 3 && b[0] == 0xF0 && esperas.TryRemove($"{b[1]}:{b[2] & 0x3F}", out var tcs)) tcs.TrySetResult(b);
  };
  data.ValueChanged += (_, a) => { try { Procesar(Leer(a.CharacteristicValue)); } catch (Exception e) { Console.WriteLine($"Error decodificando: {e.Message}"); } };
  var s1 = await data.WriteClientCharacteristicConfigurationDescriptorAsync(GattClientCharacteristicConfigurationDescriptorValue.Notify);
  var s2 = await ctrl.WriteClientCharacteristicConfigurationDescriptorAsync(GattClientCharacteristicConfigurationDescriptorValue.Indicate);
  if (s1 != GattCommunicationStatus.Success || s2 != GattCommunicationStatus.Success) { Console.WriteLine($"AVISO: no se pudo activar PMD ({s1}/{s2})"); ctrl = null; }
}
var st0 = await hrChr.WriteClientCharacteristicConfigurationDescriptorAsync(GattClientCharacteristicConfigurationDescriptorValue.Notify);
if (st0 != GattCommunicationStatus.Success) { Console.WriteLine($"No se pudo activar notificaciones de FC: {st0}"); return; }

using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
Console.WriteLine($"Conectado a {info.Name}. Esperando que inicies una sesion desde {baseUrl} ... (Ctrl+C para salir)");

async Task Informar(Dictionary<string, string> errores) {
  var lista = activos.ToList(); if (seleccion.Contains("fc")) lista.Insert(0, "fc");
  try { await http.PostAsync(baseUrl + "/api/puente", new StringContent(JsonSerializer.Serialize(new { activos = lista, errores, dispositivo = info.Name }), Encoding.UTF8, "application/json")); } catch { }
}

async Task Reconciliar(bool quiere, string sid, string[] sensores) {
  lock (lk) { midiendo = false; foreach (var l in pend.Values) l.Clear(); hrPend.Clear(); }
  foreach (var c in activos.ToList()) { try { await Cmd(new byte[] { 0x03, (byte)PMDS[c].tipo }); } catch { } }
  activos.Clear(); offsetMs = null; prevNs.Clear(); avisados.Clear();
  var errores = new Dictionary<string, string>();
  if (quiere) {
    Console.WriteLine($"== SESION {sid} INICIADA: {string.Join(", ", sensores)} ==");
    lock (lk) { sesionId = sid; seleccion = sensores; midiendo = true; }
    foreach (var c in sensores.Where(PMDS.ContainsKey)) {
      if (ctrl == null) { errores[c] = "el servicio PMD del sensor no esta disponible"; continue; }
      try { await IniciarFlujo(c); } catch (Exception e) { errores[c] = e.Message; Console.WriteLine($"  {c}: NO se pudo activar -> {e.Message}"); }
    }
  } else { Console.WriteLine("== MEDICION DETENIDA =="); lock (lk) { seleccion = Array.Empty<string>(); sesionId = null; } }
  await Informar(errores);
}

// ------------------------------------------------------------------ envio: un paquete por segundo con todo lo recibido, sin promediar
_ = Task.Run(async () => {
  while (true) {
    await Task.Delay(1000);
    Dictionary<string, object> pkt = null; var tomado = new Dictionary<string, List<Dictionary<string, object>>>(); string resumen = "";
    lock (lk) {
      if (midiendo && sesionId != null) {
        pkt = new() { ["id_sesion"] = long.Parse(sesionId), ["dispositivo"] = info.Name, ["direccion_mac"] = mac, ["timestamp"] = DateTime.UtcNow.ToString("o") };
        bool tiene = false;
        if (hrPend.Count > 0) {
          var ult = hrPend[^1]; var rr = new List<int>();
          foreach (var h in hrPend) {
            int i = 1 + ((h[0] & 1) != 0 ? 2 : 1); if ((h[0] & 0x08) != 0) i += 2;
            if ((h[0] & 0x10) != 0) for (; i + 1 < h.Length; i += 2) rr.Add((int)Math.Round(BitConverter.ToUInt16(h, i) / 1024.0 * 1000));
          }
          int hr = (ult[0] & 1) != 0 ? BitConverter.ToUInt16(ult, 1) : ult[1];
          // se envia TAL CUAL lo dijo el sensor, incluido el 0 ("sin lectura"): descartar o corregir es trabajo del backend
          pkt["frecuencia_cardiaca"] = hr; pkt["rr_ms"] = rr; pkt["fc_crudo"] = Convert.ToHexString(ult); tiene = true;
          resumen = hr > 0 ? $"FC {hr} lpm" : "FC 0 (el sensor no tiene lectura)";
          hrPend.Clear();
        }
        foreach (var (k, l) in pend) if (l.Count > 0) { tomado[k] = new(l); pkt[PMDS[k].json] = tomado[k]; l.Clear(); tiene = true; resumen += $" | {k} {tomado[k].Count}"; }
        if (!tiene) { pkt = null; if (resumen != "") Console.WriteLine(resumen); }
      }
    }
    if (pkt == null) continue;
    try {
      var r = await http.PostAsync(baseUrl + "/api/telemetria", new StringContent(JsonSerializer.Serialize(pkt), Encoding.UTF8, "application/json"));
      if ((int)r.StatusCode >= 400) {
        Console.WriteLine($"El servidor rechazo el paquete ({(int)r.StatusCode}): {await r.Content.ReadAsStringAsync()}");
        lock (lk) foreach (var (k, l) in tomado) { pend[k].InsertRange(0, l); if (pend[k].Count > 6000) pend[k].RemoveRange(0, pend[k].Count - 6000); }
      } else Console.WriteLine($"{resumen} -> {(int)r.StatusCode}");
    } catch (Exception e) {
      Console.WriteLine($"Error enviando: {e.Message}");
      lock (lk) foreach (var (k, l) in tomado) { pend[k].InsertRange(0, l); if (pend[k].Count > 6000) pend[k].RemoveRange(0, pend[k].Count - 6000); }
    }
  }
});

// ------------------------------------------------------------------ bucle de control: obedece a la pagina (iniciar / detener / sensores elegidos)
string ultimoSesion = null; bool primera = true;
while (true) {
  try {
    var j = JsonDocument.Parse(await http.GetStringAsync(baseUrl + "/api/medicion?puente=1")).RootElement;
    bool quiere = j.GetProperty("midiendo").GetBoolean();
    string sid = quiere ? j.GetProperty("id_sesion").GetInt64().ToString() : null;
    if (sid != ultimoSesion || primera) {
      primera = false; ultimoSesion = sid;
      await Reconciliar(quiere, sid, quiere ? j.GetProperty("datos").EnumerateArray().Select(x => x.GetString()).ToArray() : Array.Empty<string>());
    }
  } catch (Exception e) { Console.WriteLine($"(sin conexion con el servidor: {e.Message})"); }
  await Task.Delay(1000);
}
