// Catálogo de señales y sensores (compatible con la implementación del sensor Polar Verity Sense)
export const SENSORES_DISPONIBLES = [
  {
    k: 'fc',
    nombre: 'Frecuencia Cardíaca',
    unidad: 'BPM',
    frecuencia: '1 Hz',
    desc: 'Pulsaciones en tiempo real (BPM) e intervalos para estimar intensidad.',
    icono: '❤️',
    color: '#e94560',
    activoPorDefecto: true
  },
  {
    k: 'acc',
    nombre: 'Acelerómetro (3 Ejes)',
    unidad: 'mG',
    frecuencia: '50 Hz',
    desc: 'Registro mecánico triaxial (X, Y, Z) para análisis biomecánico.',
    icono: '🏃',
    color: '#38bdf8',
    activoPorDefecto: true
  },
  {
    k: 'ppg',
    nombre: 'Fotopletismografía (PPG)',
    unidad: 'cuentas',
    frecuencia: '50 Hz',
    desc: 'Luz reflejada por la piel en canales ópticos para pulso arterial.',
    icono: '🟢',
    color: '#10b981',
    activoPorDefecto: false
  },
  {
    k: 'gyro',
    nombre: 'Giroscopio',
    unidad: '°/s',
    frecuencia: '50 Hz',
    desc: 'Velocidad angular de rotación del sensor en 3 ejes.',
    icono: '🔄',
    color: '#fbbf24',
    activoPorDefecto: false
  },
  {
    k: 'rr',
    nombre: 'Intervalo RR / PPI',
    unidad: 'ms',
    frecuencia: 'Variable',
    desc: 'Tiempo pulso a pulso entre latidos para variabilidad cardíaca (HRV).',
    icono: '⏱️',
    color: '#a855f7',
    activoPorDefecto: false
  }
]

export const NOMBRES_SENSORES = Object.fromEntries(
  SENSORES_DISPONIBLES.map(s => [s.k, s.nombre])
)
