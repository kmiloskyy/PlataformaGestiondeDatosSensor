// Catálogo de datos que se pueden medir (espejo de backend/src/datos/catalogo.ts).
export const SENSORES = [
  { k: 'fc', nombre: 'Frecuencia cardíaca', desc: 'lpm + intervalos RR' },
  { k: 'acc', nombre: 'Acelerómetro', desc: 'X / Y / Z en mG' },
  { k: 'gyro', nombre: 'Giroscopio', desc: 'X / Y / Z, giro del sensor' },
  { k: 'mag', nombre: 'Magnetómetro', desc: 'X / Y / Z, campo magnético' },
  { k: 'ppg', nombre: 'PPG (óptico)', desc: 'luz reflejada por la piel' },
  { k: 'ppi', nombre: 'PPI', desc: '⚠ tiempo entre pulsos; con PPI activo el sensor suele dejar de dar la frecuencia cardíaca' },
]
export const NOMBRE = Object.fromEntries(SENSORES.map((s) => [s.k, s.nombre]))

// Cómo se dibuja cada dato: columnas del punto [t, v1, v2, ...] que se grafican y sus colores.
export const CONF = {
  fc: { titulo: 'Frecuencia cardíaca (lpm)', series: [['FC', '#34d399']], puntos: true },
  acc: { titulo: 'Acelerómetro (mG · 1000 mG = 1 g)', series: [['X', '#f87171'], ['Y', '#fbbf24'], ['Z', '#38bdf8']] },
  gyro: { titulo: 'Giroscopio (°/s)', series: [['X', '#f87171'], ['Y', '#fbbf24'], ['Z', '#38bdf8']] },
  mag: { titulo: 'Magnetómetro (gauss)', series: [['X', '#f87171'], ['Y', '#fbbf24'], ['Z', '#38bdf8']] },
  ppg: { titulo: 'PPG (luz reflejada, cuentas del sensor)', series: [['PPG 0', '#34d399'], ['PPG 1', '#f87171'], ['PPG 2', '#38bdf8'], ['Ambiente', '#94a3b8']] },
  ppi: { titulo: 'PPI (ms entre pulsos)', series: [['Intervalo', '#fbbf24']], puntos: true },
}

// Explica los bytes crudos del paquete estándar "Heart Rate Measurement" (Bluetooth SIG, 0x2A37).
export function explicarFc(hex) {
  const b = hex.match(/../g).map((x) => parseInt(x, 16))
  const flags = b[0]
  const es16 = flags & 1
  let i = 1
  const hr = es16 ? b[i] | (b[i + 1] << 8) : b[i]
  i += es16 ? 2 : 1
  if (flags & 0x08) i += 2
  const rr = []
  if (flags & 0x10) for (; i + 1 < b.length; i += 2) rr.push(Math.round(((b[i] | (b[i + 1] << 8)) / 1024) * 1000))
  return `bytes: ${b.map((x) => x.toString(16).padStart(2, '0')).join(' ')}\nflags: 0b${flags.toString(2).padStart(8, '0')}\nfrecuencia cardíaca: ${hr} lpm${hr === 0 ? ' (0 = el sensor no tiene lectura)' : ''}\nintervalos RR (ms): ${rr.length ? rr.join(', ') : '— (este sensor no los envía aquí)'}`
}

export const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString() : '')
