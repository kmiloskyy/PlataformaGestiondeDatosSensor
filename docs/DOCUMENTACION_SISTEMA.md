# Documentación del sistema: recolección de datos crudos del sensor Polar Verity Sense

> Documento pensado para **explicar el sistema paso a paso**: qué se construyó, en qué orden, qué decisión se tomó en cada punto y por qué.
> Cada decisión tiene un código (D-01, D-02…) que también aparece en comentarios del código fuente.

---

## 0. Resumen en un minuto

**Qué es.** Un sistema que lee **todos los datos que entrega un sensor Polar Verity Sense** (frecuencia cardíaca, acelerómetro, giroscopio, magnetómetro, PPG óptico y PPI), los **guarda en bruto** en PostgreSQL y los muestra en una web.

**Cómo funciona, en cuatro piezas:**

```
 ┌──────────────┐  Bluetooth LE  ┌───────────────┐  HTTP + JSON   ┌──────────────┐   SQL   ┌────────────┐
 │ Polar Verity │ ─────────────► │    PUENTE     │ ─────────────► │  API NestJS  │ ──────► │ PostgreSQL │
 │    Sense     │  (datos crudos)│ (.NET, Windows)│ 1 paquete/seg │ (backend/)   │         │            │
 └──────────────┘                └───────────────┘                └──────┬───────┘         └────────────┘
                                         ▲                                │  HTTP + JSON
                                         │ "inicia/detén, y mide X, Y, Z" │
                                         └────────────────────────────────┤
                                                                   ┌──────┴───────┐
                                                                   │  Vue (web)   │
                                                                   │ (frontend/)  │
                                                                   └──────────────┘
```

1. **Sensor**: mide y emite datos por Bluetooth.
2. **Puente** (`puente/`): programa de Windows que se conecta al sensor, activa solo los datos que se pidieron y reenvía **todo tal como llegó**.
3. **API NestJS** (`backend/`): valida, ordena y guarda; entrega los datos para gráficos y exportación.
4. **Web Vue** (`frontend/`): el usuario elige qué medir, inicia/detiene la sesión y ve los gráficos.

**Regla que gobierna todo el diseño (D-02):** *recolectar y almacenar en bruto; los cálculos y estimaciones se hacen después, en el backend.* Ni el puente ni la API promedian, filtran, corrigen o estiman nada.

---

## 1. Historia del desarrollo, paso a paso

El sistema no se diseñó de golpe: cada paso resolvió un problema real que apareció en el anterior. Esto es lo que pasó y por qué el diseño final es como es.

| Paso | Qué se hizo | Qué problema apareció | Cómo se resolvió |
|---|---|---|---|
| 1 | **Prototipo**: página web + servidor Express + SQLite. El navegador se conectaba al sensor con *Web Bluetooth*. | Chrome mostraba *"Web Bluetooth API globally disabled"* y, cuando funcionaba, **no listaba el sensor**: Windows ya lo tenía emparejado y un sensor conectado deja de anunciarse. | Se dejó de usar el navegador para el Bluetooth (D-01). |
| 2 | **Puente en .NET** que habla con el sensor con las APIs Bluetooth LE de Windows y envía los datos a la API por HTTP. | PowerShell 5.1 no puede suscribirse a eventos de objetos WinRT; `csc.exe` no carga los metadatos de Windows. | Proyecto `dotnet` (SDK 10) con las APIs de Windows integradas. |
| 3 | **Acelerómetro**: se implementó el protocolo propietario **PMD** de Polar (el SDK oficial solo existe para Android/iOS). | Los datos llegaban *comprimidos* (una muestra de referencia + diferencias empaquetadas en bits). | Se escribió el descompresor y se verificó que no se pierden muestras (comparando muestras recibidas contra el tiempo entre paquetes). |
| 4 | Se dejó de enviar un promedio de movimiento y se envía **cada muestra X/Y/Z**, agrupadas en **sesiones** (desde que se inicia hasta que se detiene). | El sensor muestrea a ~50,1 Hz reales, no a 52 exactos; calcular la hora de cada muestra con 52 Hz dejaba huecos falsos. | La hora de cada muestra se calcula con el intervalo real entre paquetes (D-07). |
| 5 | **Todos los sensores** (giroscopio, magnetómetro, PPG, PPI) y **elegir qué medir antes de iniciar**. | Los formatos de cada sensor son distintos; no se conocían con certeza. | Se leyeron del código fuente del SDK oficial (rama `master` de `polarofficial/polar-ble-sdk`) y se comprobó cada uno con datos reales. |
| 6 | Pruebas con todos los sensores a la vez. | Con **PPI activo** el sensor deja de entregar la frecuencia cardíaca (marca 0). | Se documentó; se decidió guardar el 0 como dato crudo (D-08) y **no estimar en el puente** (D-02). |
| 7 | **Migración al repositorio del equipo** (NestJS + Vue + PostgreSQL). | El modelo de datos del equipo tenía una fila "ancha" con campos obligatorios, que no admite sensores de frecuencias distintas. | Se extendió el modelo conservando sus nombres (D-05). |

> El prototipo original (Express + SQLite) sigue existiendo en la carpeta `polar-demo` fuera de este repositorio, solo como referencia histórica.

---

## 2. El sensor y sus protocolos

### 2.1 Dos "idiomas" Bluetooth

El Verity Sense habla dos protocolos. Se usan los dos:

**a) Servicio estándar de frecuencia cardíaca** (Bluetooth SIG, servicio `0x180D`, característica `0x2A37`).
Es público y lo entienden todos los pulsómetros. Cada notificación (≈ 1 por segundo) trae:

```
byte 0: flags   bit0 → el pulso viene en 8 o 16 bits · bit3 → trae energía gastada · bit4 → trae intervalos RR
byte 1…: frecuencia cardíaca (lpm) [+ energía] [+ intervalos RR en 1/1024 s]
```
Ejemplo real: `00 5A` → flags 0, frecuencia = 0x5A = **90 lpm**. Este sensor **no envía RR** por aquí.

**b) Servicio PMD (Polar Measurement Data)** — propietario, UUID `fb005c80-02e7-f387-1cad-8acd2d8df0c8`.
Es el que da acelerómetro, giroscopio, magnetómetro, PPG y PPI. Tiene dos características:

| Característica | UUID (termina igual que el servicio) | Para qué |
|---|---|---|
| Punto de control | `fb005c81-…` | Se le **escriben comandos** y responde por *indicaciones* |
| Datos | `fb005c82-…` | El sensor **envía** las muestras por *notificaciones* |

### 2.2 Cómo se le pide un dato al sensor (comandos PMD)

| Comando | Bytes | Qué hace |
|---|---|---|
| Pedir ajustes | `01 <tipo>` | El sensor responde qué frecuencias, resoluciones, rangos y canales soporta |
| Iniciar | `02 <tipo> [ajustes]` | Empieza a emitir ese dato con los ajustes elegidos |
| Detener | `03 <tipo>` | Deja de emitir |

Códigos de tipo: **PPG = 1, ACC = 2, PPI = 3, GYRO = 5, MAG = 6**. Las respuestas empiezan con `0xF0`, repiten comando y tipo, y traen un código de error (0 = éxito).

**Decisión de ajustes:** el puente pregunta al sensor qué soporta y elige **el máximo de cada ajuste** (frecuencia, resolución, rango, canales): así se captura la mayor información posible. Valores observados en el equipo real:

| Dato | Frecuencia | Factor de escala | Unidad guardada |
|---|---|---|---|
| Acelerómetro | 52 Hz nominal (≈ 50,1 Hz medidos) | 1 | mG (1000 mG = 1 g) |
| Giroscopio | 52 Hz | 0,07 | grados/s |
| Magnetómetro | 100 Hz | 0,0015 | gauss |
| PPG | 55 Hz | 1 | cuentas ópticas |
| PPI | 1 muestra por pulso | — | milisegundos |

### 2.3 Formato de los datos (lo más delicado)

Cada notificación de datos empieza con una cabecera fija de 10 bytes:

```
byte 0      tipo de dato (2 = ACC, 5 = GYRO, …)
bytes 1-8   marca de tiempo del sensor: nanosegundos desde 2000-01-01, entero de 64 bits, little-endian.
            Es el instante de la ÚLTIMA muestra del paquete.
byte 9      tipo de trama; el bit 7 (0x80) significa "comprimida"
bytes 10…   las muestras
```

**Tramas comprimidas (delta):** para ahorrar ancho de banda, el sensor manda **una muestra completa de referencia** y después **bloques** `[ancho_en_bits][cantidad][diferencias empaquetadas bit a bit]`. Cada muestra nueva = muestra anterior + diferencia. Hay que leer los bits de menor a mayor peso y extender el signo. Esto está en `Delta(...)` de `puente/Program.cs`.

**Hora de cada muestra:** el paquete trae solo la hora de la última. Las anteriores se reconstruyen hacia atrás con el **paso real** = (tiempo entre este paquete y el anterior) / (muestras del paquete). Se probó que así no hay huecos ni desorden (D-07).

**Particularidad del PPI:** el sensor manda la hora en 0. Sus muestras se fechan por la llegada del paquete y yendo hacia atrás por cada intervalo; por eso **la hora del PPI es aproximada**.

---

## 3. El puente (`puente/Program.cs`)

**Qué es:** un programa de consola .NET que se ejecuta en el PC con Bluetooth. **Hace una sola cosa: leer el sensor y reenviar lo que lee.**

**Ciclo de vida:**

1. Busca el dispositivo "Polar" ya emparejado en Windows y se conecta (si Windows aún lo tiene tomado, reintenta hasta 60 s: error `AccessDenied`).
2. Activa la suscripción a la frecuencia cardíaca y a los canales PMD, pero **no empieza a medir nada**.
3. **Cada segundo pregunta a la API** `GET /api/medicion?puente=1`. Si aparece una sesión nueva, **activa en el sensor solo los datos elegidos**; si la sesión se detuvo, los apaga.
4. **Cada segundo envía un paquete** `POST /api/telemetria` con todo lo recibido en ese segundo.
5. Informa a la API qué datos pudo activar y cuáles no (y el motivo) con `POST /api/puente`, para que la web lo muestre.

**Decisiones del puente:**

* **No procesa nada (D-02).** Envía incluso el 0 de la frecuencia cardíaca. Antes tenía una estimación de FC a partir del PPI; se **eliminó** del puente porque esa clase de cálculo corresponde al backend.
* **Paquete cada segundo (D-03):** un envío por muestra (≈ 300/s) saturaría la red; un envío por segundo es un buen equilibrio entre latencia y eficiencia.
* **Si el servidor rechaza o no responde, no se pierden muestras:** se reencolan (con tope de 6000 por dato).
* **Se identifica al sensor por su dirección MAC**, que se extrae del identificador de Windows.

---

## 4. La API NestJS (`backend/`)

### 4.1 Estructura de módulos

```
backend/src/
├── app.module.ts            Conexión a PostgreSQL (TypeORM) + los módulos de abajo
├── main.ts                  Prefijo /api y límite de 5 MB por petición
├── entities/                Tablas (las del equipo, extendidas)
├── datos/                   LÓGICA PURA (sin base de datos, con pruebas unitarias)
│   ├── catalogo.ts            ← única fuente de verdad: qué datos existen y a qué columna va cada campo
│   ├── validacion.ts          valida lo que entra
│   ├── mapeo.ts               paquete JSON → filas de Muestreo_datos
│   └── exportacion.ts         filas → JSON de la sesión
├── medicion/                Control: iniciar/detener sesión, estado, información del puente
├── ingesta/                 Recibe y guarda los paquetes del puente
├── consultas/               Sesiones, gráficos, JSON, CSV, "último dato"
└── seed/                    Sujeto de demostración
```

**Por qué esta separación:** cada módulo tiene una responsabilidad (controlar / guardar / leer). Lo que se puede probar sin base de datos (`datos/`) está aislado, y por eso tiene pruebas unitarias.

### 4.2 Endpoints

Todos cuelgan de `/api`.

| Método y ruta | Quién la usa | Qué hace |
|---|---|---|
| `POST /medicion` `{id_sujeto, datos:[…]}` | Web | **Inicia** una sesión eligiendo qué datos medir |
| `POST /medicion` `{midiendo:false}` | Web | **Detiene** la sesión |
| `GET /medicion` | Web y puente | Estado: ¿hay sesión?, ¿qué datos?, ¿el puente está vivo? |
| `POST /puente` | Puente | Informa qué datos pudo activar |
| `POST /telemetria` | Puente | **Entrega un paquete crudo** (201 guardado · 202 ignorado · 400 inválido) |
| `GET /sujetos` | Web | Lista sujetos (solo id y nombre; nunca RUT, peso ni contraseña) |
| `GET /sesiones` | Web | Lista sesiones con cuántas filas hay de cada dato |
| `GET /sesiones/:id` | Usuario | **JSON completo** de la sesión (`?descargar=1` lo baja como archivo) |
| `GET /sesiones/:id/series` | Web | Datos de una ventana de tiempo para graficar |
| `GET /sesiones/:id/csv/:dato` | Usuario | CSV de un dato (`fc`, `rr`, `acc`, `gyro`, `mag`, `ppg`, `ppi`) |
| `GET /ultimo` | Web | Lo último que llegó (lpm grande y panel "Así llegan los datos") |

### 4.3 El contrato del paquete (lo que envía el puente)

```json
{
  "id_sesion": 2,
  "dispositivo": "Polar Sense B1CEC12F",
  "direccion_mac": "A0:9E:1A:B1:CE:C1",
  "timestamp": "2026-11-09T20:16:00.000Z",
  "frecuencia_cardiaca": 90,          // 0 = el sensor no tiene lectura (se guarda igual)
  "rr_ms": [],
  "fc_crudo": "005A",                 // bytes originales del paquete de FC, en hexadecimal
  "acelerometro": [ { "timestamp": "…", "x": -156, "y": 218, "z": 939, "sensor_ns": "536583536428403381" }, … ],
  "giroscopio":   [ { "timestamp": "…", "x": -42.28, "y": 28.77, "z": 74.34, "sensor_ns": "…" }, … ],
  "magnetometro": [ { "timestamp": "…", "x": 1.31, "y": 0.11, "z": 0.36, "calibracion": 2, "sensor_ns": "…" }, … ],
  "ppg":          [ { "timestamp": "…", "ppg0": 573001, "ppg1": 566321, "ppg2": 561112, "ambiente": 372003, "sensor_ns": "…" }, … ],
  "ppi":          [ { "timestamp": "…", "pp_ms": 640, "error_ms": 30, "hr": 0, "contacto_piel": 1, "bloqueado": 0, "sensor_ns": "…" } ]
}
```
Solo vienen los arreglos de los datos que se eligieron al iniciar la sesión.

### 4.4 Qué pasa en una sesión (secuencia)

```
Web                      API (Nest)                        Puente                    Sensor
 │ POST /medicion          │                                  │                          │
 │ {sujeto, datos}  ─────► │ crea Sesion_Grabacion            │                          │
 │                         │ (estado 'en_curso')              │                          │
 │                         │ ◄──────── GET /medicion?puente=1 │ (cada segundo)           │
 │                         │ ───────► {midiendo, id_sesion,   │                          │
 │                         │           datos:[acc, gyro…]}    │ ── 02 <tipo> ─────────►  │ empieza a medir
 │                         │                                  │ ◄──── muestras crudas ── │
 │                         │ ◄──── POST /telemetria (1/seg) ──│                          │
 │                         │ valida → crea Sensor+Vinculación │                          │
 │                         │ (1ª vez) → inserta filas         │                          │
 │ POST /medicion          │                                  │                          │
 │ {midiendo:false} ─────► │ cierra sesión y vinculación      │                          │
 │                         │ ◄──────── GET /medicion?puente=1 │ ── 03 <tipo> ─────────►  │ deja de medir
```

### 4.5 Decisiones de la API

* **La sesión manda (D-04).** Elegir qué medir es una propiedad de la sesión y se fija **antes de iniciar**; durante la sesión no cambia. Así cada sesión es un conjunto coherente de datos. Se guarda en `Sesion_Grabacion.datos_seleccionados`.
* **El estado "hay una sesión activa" vive en memoria** del servidor (una sesión a la vez, un sensor). Es la solución más simple para el alcance actual. Si el servidor se cae, al arrancar **cierra** las sesiones que quedaron abiertas en el último dato guardado.
* **Qué pasa con paquetes de una sesión ya detenida:** se responde **202 y se descartan** (los últimos < 1 s en vuelo se pierden).
* **El sensor se registra solo (D-10):** con el primer paquete se busca el sensor por MAC; si no existe, se crea en `Sensor`, y se crea la `Vinculacion` sensor↔sesión. Se cierra al detener.
* **La validación está escrita a mano (D-09)** como funciones puras (`datos/validacion.ts`): no agrega dependencias, replica la validación del prototipo y se prueba fácilmente. Cambiar a un validador con esquemas (Zod, por ejemplo) sería posible sin tocar el resto.
* **Inserciones por lotes** de hasta 1000 filas dentro de una transacción: un paquete se guarda completo o no se guarda.

---

## 5. El modelo de datos

### 5.1 Lo que ya existía (equipo)

```
Rol ─1:N─ Sujeto_estudio ─1:N─ Sesion_Grabacion ─1:N─ Vinculacion ─N:1─ Sensor
                                                          │
                                                          └─1:N─ Muestreo_datos
```
* `Sujeto_estudio`: la persona medida. `Sesion_Grabacion`: una grabación. `Sensor`: el dispositivo.
* `Vinculacion`: "este sensor estuvo en esta sesión entre estas fechas". `Muestreo_datos`: las lecturas.

### 5.2 El problema con `Muestreo_datos` original

Tenía **una fila por instante** con **todas las columnas obligatorias**: `acel_x, acel_y, acel_z, ppg_raw, frecuencia_cardiaca, intervalo_rr`. Eso exige que en cada fila haya un valor de *todos* los sensores, pero:

* el acelerómetro llega a ~50 Hz, el magnetómetro a 100 Hz, el PPG a 55 Hz y la frecuencia cardíaca a 1 Hz → **no coinciden en el tiempo**;
* habría que **inventar** valores (repetir, interpolar, promediar) para rellenar, lo que contradice "guardar en bruto";
* faltaban columnas para giroscopio, magnetómetro, canales extra del PPG y PPI.

### 5.3 Qué se decidió (D-05)

**Una fila = una muestra cruda de un tipo de dato.** Se conservaron los nombres originales y se agregaron columnas; todas las de medición pasaron a **opcionales**, y una columna nueva `tipo_dato` dice cuáles son las válidas en esa fila.

| Cambio | Detalle |
|---|---|
| Se **conservan** | `acel_x/y/z`, `ppg_raw` (= canal 0 del PPG), `frecuencia_cardiaca`, `intervalo_rr` (ahora opcionales) |
| Se **agregan** | `tipo_dato`, `sensor_ns`, `gyro_x/y/z`, `mag_x/y/z`, `mag_calibracion`, `ppg_1`, `ppg_2`, `ppg_ambiente`, `fc_crudo`, `ppi_ms`, `ppi_error_ms`, `ppi_hr`, `ppi_contacto_piel`, `ppi_bloqueado` |
| `timestamp` | de `timestamp` a **`timestamptz`** (UTC; D-07) |
| `Sesion_Grabacion` | + `datos_seleccionados` (jsonb); `fecha_inicio`/`fecha_fin` a `timestamptz`; `fecha_fin` admite null |
| `Vinculacion` | fechas a `timestamptz` |
| Índice | `(id_vinculacion, tipo_dato, timestamp)` para consultar por sesión, dato y ventana de tiempo |

**Valores de `tipo_dato`:** `fc`, `rr`, `acc`, `gyro`, `mag`, `ppg`, `ppi`. (Cada intervalo RR de la frecuencia cardíaca es su propia fila `rr`.)

Ejemplo (una sesión de 1 segundo con acelerómetro y FC):

| id_lectura | tipo_dato | timestamp | acel_x | acel_y | acel_z | frecuencia_cardiaca | … |
|---|---|---|---|---|---|---|---|
| 1 | fc | 20:16:00.000 | — | — | — | 90 | |
| 2 | acc | 20:16:00.019 | -156 | 218 | 939 | — | |
| 3 | acc | 20:16:00.038 | -154 | 246 | 903 | — | |

**Alternativas descartadas:**
* *Mantener la fila ancha:* obliga a inventar datos.
* *Una tabla por sensor:* más limpia en teoría, pero cambia el modelo del equipo y multiplica consultas y relaciones.
* *Tabla "larga" genérica (sensor, canal, valor):* muy flexible, pero pierde nombres legibles y es más difícil de explicar y consultar.

**Costo asumido:** muchas columnas con `NULL` por fila. Es el precio de conservar los nombres del equipo y de que cada columna sea autoexplicativa. Volumen estimado: ~260 filas/s con FC + acelerómetro + giroscopio + magnetómetro + PPG (≈ 0,9 millones de filas por hora); PostgreSQL lo maneja bien con el índice indicado.

### 5.4 Decisiones de datos relacionadas

* **D-06 — Catálogo único (`datos/catalogo.ts`).** Para cada dato define el nombre del arreglo JSON, qué campos tiene, cuáles son obligatorios, a qué columna va cada uno y la unidad. Validación, guardado, gráficos y exportación leen de ahí. **Agregar un sensor nuevo = una entrada nueva en el catálogo + sus columnas.**
* **D-07 — Tiempo.** (a) `timestamptz` para no depender de la zona horaria del servidor. (b) Se guarda también `sensor_ns` (el reloj interno del sensor): es el dato original y permite reconstruir el tiempo exacto. (c) El tiempo de cada muestra = reloj del sensor + diferencia fija con el reloj del PC (se fija con el primer paquete de la sesión); el reloj del sensor puede estar años desfasado, pero sus **intervalos** son confiables.
* **D-08 — La frecuencia cardíaca 0 se guarda.** El sensor informa 0 cuando no tiene lectura. Es información (así se descubrió el conflicto con PPI). Se guarda y se exporta; **solo se omite al dibujar y en el número grande de lpm**.
* **D-11 — Reducción solo para graficar.** `GET /series` devuelve como máximo ~1500 puntos por dato (toma 1 de cada *n* con `ROW_NUMBER()`), para que el gráfico sea fluido. **El JSON y los CSV son siempre completos.**

---

## 6. La web Vue (`frontend/`)

| Archivo | Responsabilidad |
|---|---|
| `src/api.js` | Cliente de la API (todas las llamadas HTTP en un solo lugar) |
| `src/catalogo.js` | Datos disponibles, colores/títulos de gráficos y explicación de los bytes de FC |
| `src/store.js` | Estado compartido (`reactive`) y sondeo periódico del backend |
| `components/PanelSesion.vue` | Elegir sujeto y datos, **iniciar/detener**, estado del puente |
| `components/UltimoPaquete.vue` | Número grande de lpm, bytes crudos de FC explicados, último segundo guardado |
| `components/GraficoSesion.vue` | Elegir sesión, ancho de ventana, **deslizador pasado↔presente**, "seguir en vivo" |
| `components/GraficoSerie.vue` | Un gráfico (Chart.js) de un dato |
| `components/TablaSesiones.vue` | Sesiones con enlaces a gráfico, JSON y CSV por dato |

**Decisiones:**
* **D-12 — Sondeo (*polling*) en vez de WebSockets:** la pantalla consulta cada 1–2 s. Es más simple, suficiente para datos de 1 paquete/s y fácil de depurar. Los WebSockets serían la mejora natural si se necesitara menor latencia.
* **En desarrollo, Vite reenvía `/api` al backend** (`vite.config.js`), así no hace falta configurar CORS.
* **Gráfico de la sesión completa:** el deslizador mueve una *ventana* (10 s, 30 s, 1 min, 5 min o toda la sesión) a lo largo de la sesión; en cada movimiento se piden al servidor solo los puntos de esa ventana. "Seguir en vivo" mantiene la ventana pegada al presente. Hay **un gráfico por dato**, todos con la misma ventana de tiempo.

---

## 7. Registro de decisiones (resumen)

| Código | Decisión | Por qué | Consecuencia |
|---|---|---|---|
| **D-01** | El Bluetooth lo maneja un **puente nativo**, no el navegador | Web Bluetooth no ve sensores ya emparejados en Windows y puede estar deshabilitado; además da acceso al protocolo PMD completo | Hay un programa más que ejecutar (solo Windows) |
| **D-02** | **Solo datos crudos** en puente y API; cálculos en el backend, después | Los datos crudos no se pueden recuperar si se promedian; los cálculos se pueden rehacer cuando se quiera | Hay que construir luego el módulo de análisis (ver §9) |
| **D-03** | Un paquete por segundo con arreglos de muestras | Equilibrio entre latencia y eficiencia; el paquete se guarda en una transacción | Se pierde como máximo ~1 s al detener |
| **D-04** | Sesión = unidad de medición; datos elegidos antes de iniciar; estado activo en memoria | Sesiones coherentes y simples; el puente solo necesita preguntar una cosa | Una sesión a la vez, un sensor |
| **D-05** | `Muestreo_datos`: una fila por muestra, columnas opcionales + `tipo_dato` | Los sensores tienen frecuencias distintas; no inventar datos | Muchos `NULL`; ver §5.3 |
| **D-06** | Catálogo único de datos | Un solo lugar donde se define cada sensor | Agregar sensores es barato |
| **D-07** | `timestamptz`; guardar `sensor_ns`; paso real entre muestras | Tiempo sin ambigüedad y reconstruible | El PPI tiene hora aproximada |
| **D-08** | FC = 0 se guarda como dato crudo | Es información del sensor | Los gráficos la ignoran |
| **D-09** | Validación escrita a mano, como funciones puras | Sin dependencias, probada | Si crece, migrar a un validador de esquemas |
| **D-10** | El sensor y la vinculación se crean solos con el primer paquete (por MAC) | No hace falta registrar el sensor a mano | Un sensor sin MAC queda como "desconocida" |
| **D-11** | Reducir puntos solo para graficar | Gráficos fluidos sin perder datos | El gráfico es una vista, no el dato |
| **D-12** | Sondeo en vez de WebSockets | Simplicidad | Latencia de 1–2 s en pantalla |
| **D-13** | Sujeto de demostración automático (solo fuera de producción) | Una base vacía no permite iniciar sesiones | Se apaga con `SEED_DEMO=false` |
| **D-14** | Se mantiene `synchronize: true` del equipo; los cambios de esquema son aditivos | No romper su flujo de trabajo | **En producción debería usarse migraciones** (ver §9) |

---

## 8. Cómo ejecutarlo, paso a paso

**Requisitos:** Node 22+ (se probó con 24), Docker, .NET SDK 10 (solo para el puente, Windows con Bluetooth), el sensor **emparejado en Windows**.

1. **Base de datos**
   ```
   cd backend
   docker compose up -d          # PostgreSQL 16 en el puerto 5432
   ```
   Si el puerto 5432 está ocupado por otro proyecto, levantar PostgreSQL en otro puerto y poner ese puerto en `backend/.env` (`DB_PORT`). Las variables están en `backend/.env.example`.
2. **Backend**
   ```
   cd backend && npm install && npm run start:dev      # http://localhost:3000/api
   ```
   Al arrancar crea las tablas y un sujeto de demostración.
3. **Frontend**
   ```
   cd frontend && npm install && npm run dev            # http://localhost:5173 (o el siguiente puerto libre)
   ```
4. **Puente** (Windows)
   ```
   cd puente && dotnet build -c Release -o bin
   .\bin\puente-polar.exe                                # opcional: puente-polar.exe http://localhost:3000 Polar
   ```
   Si acaba de usarse el sensor con otra aplicación, Windows tarda unos segundos en soltarlo; el puente reintenta solo.
5. **Usar:** en la web elegir sujeto y datos → **Iniciar sesión** → ver gráficos → **Detener** → descargar JSON/CSV.

**Pruebas automáticas:** `cd backend && npm test` (11 pruebas de validación, mapeo y exportación).

---

## 9. Limitaciones conocidas y siguientes pasos

**Hallazgos del sensor (reales, medidos):**
* **PPI y frecuencia cardíaca chocan.** Con PPI activo el sensor suele entregar FC = 0 (a veces solo los primeros ~20 s, a veces toda la sesión). Sin PPI, la FC se registró en el 100 % de los segundos de la prueba. Además, con movimiento el sensor marca los intervalos PPI como poco fiables (`ppi_bloqueado = 1`).
* **El sensor muestrea a ~50,1 Hz**, no a los 52 Hz nominales.
* **Los valores del magnetómetro no están calibrados** y son sensibles a imanes y metales cercanos (se midieron ~1,3 gauss en un eje).
* **Este sensor no envía intervalos RR** en el servicio estándar de FC.

**Límites del sistema actual:**
* Una sesión y un sensor a la vez. El puente es solo para Windows.
* La API **no tiene autenticación**: cualquiera con acceso a la red puede iniciar sesiones y leer datos. Debe agregarse antes de usarlo fuera de un entorno controlado.
* `synchronize: true` modifica el esquema al arrancar: útil en desarrollo, **no apto para producción** (usar migraciones de TypeORM).
* Al detener se pierden los últimos < 1 s en vuelo.
* Observación sobre el modelo existente: `Sujeto_estudio.Password` es texto; las contraseñas deberían guardarse con *hash*.

**Siguiente paso previsto — los cálculos en el backend (D-02).** Como todo está guardado en bruto, se pueden agregar sin tocar el puente ni los datos. Sugerencia: un módulo `analisis/` que lea `Muestreo_datos`. Ejemplos de lo que irá ahí:

| Cálculo | Entrada cruda | Idea |
|---|---|---|
| Intensidad de movimiento | `acel_x/y/z` | desviación de la magnitud respecto de 1 g (1000 mG), promediada por ventana |
| Frecuencia cardíaca de respaldo | `ppi_ms`, `ppi_bloqueado` | 60000 / mediana de intervalos válidos, **marcada como estimada** y guardada aparte, sin sobrescribir lo crudo |
| Variabilidad (HRV) | `ppi_ms` o picos del PPG | RMSSD / SDNN sobre intervalos válidos |
| Orientación | acelerómetro + giroscopio + magnetómetro | fusión de sensores |

---

## 10. Preguntas que pueden hacer (y cómo responderlas)

**¿Por qué no se conecta directamente desde el navegador?** Porque Web Bluetooth no encuentra sensores ya emparejados en Windows y no puede hablar el protocolo PMD con la misma flexibilidad; un puente nativo lo resuelve y es más estable (D-01).

**¿Por qué no usaron el SDK oficial de Polar?** Solo existe para Android e iOS. Se implementó el mismo protocolo, tomando el formato del código fuente del SDK y comprobándolo con datos reales.

**¿Cómo saben que no se pierden datos?** Se comparó, por cada paquete, el número de muestras recibidas con el tiempo transcurrido según el reloj del sensor: coinciden. Resultado: sin huecos ni desorden en acelerómetro, giroscopio, magnetómetro y PPG.

**¿Por qué guardan datos tan voluminosos?** Porque los cálculos futuros (HRV, orientación, detección de artefactos) necesitan la señal original; un promedio no se puede deshacer (D-02).

**¿Qué pasa si se cae el servidor o la red?** El puente reencola las muestras no entregadas. Si cae el servidor con una sesión abierta, al volver cierra esa sesión en su último dato.

**¿Por qué la frecuencia cardíaca a veces es 0?** Es lo que informa el sensor cuando no tiene lectura (contacto flojo o mientras corre el análisis PPI). Se guarda tal cual y no se dibuja.

**¿Se puede agregar otro sensor?** Sí: una entrada en `datos/catalogo.ts`, sus columnas en `Muestreo_datos` y, si es un sensor Polar, su formato en el puente.

---

## 11. Glosario

* **BLE:** Bluetooth de bajo consumo, el que usan los sensores.
* **PMD:** *Polar Measurement Data*, protocolo propietario de Polar para datos crudos.
* **ACC / GYRO / MAG:** acelerómetro (aceleración), giroscopio (giro) y magnetómetro (campo magnético).
* **PPG:** fotopletismografía; luz reflejada por la piel, de donde se obtiene el pulso.
* **PPI:** intervalo pulso a pulso calculado por el sensor.
* **RR:** intervalo entre latidos (ms).
* **mG / g:** milésimas de g / aceleración de la gravedad (1 g = 1000 mG).
* **Muestra cruda:** valor tal como lo entregó el sensor, sin promediar ni corregir.
* **Sesión:** período entre *Iniciar* y *Detener*, con los datos elegidos.
* **Vinculación:** registro de que un sensor participó en una sesión.
