// =============================================================================
// PUENTE Y GESTOR DE DATOS DE SENSORES POLAR (sensorBridge.js)
// =============================================================================
// Este archivo actúa como capa de abstracción entre la interfaz visual (Vue)
// y la extracción física de datos del sensor desarrollada por el equipo.
//
// 🎯 NOTA PARA QUIEN INTEGRE EL SENSOR REAL:
// Para reemplazar la simulación visual por datos reales:
// 1. Descomentar las llamadas a la API de NestJS o WebSocket en 'iniciarGrabacion()' y 'detenerGrabacion()'.
// 2. Invocar 'inyectarPaqueteReal(paquete)' cada vez que llegue un paquete del sensor/puente.
// Todo el resto de la interfaz (gráficos, tarjetas de clase, reportes) se actualizará automáticamente.
// =============================================================================

import { reactive } from 'vue'

export const sensorState = reactive({
  // Modo de operación de la interfaz
  modoVista: 'clase', // 'clase' (RF-09: 12+ dispositivos), 'individual' (RF-03), 'movil' (RF-10)

  // Estado de la sesión de grabación (RF-02)
  grabando: false,
  tiempoTranscurrido: 0,
  cronometroTexto: '00:00',
  muestrasRegistradas: 0,
  tituloSesion: 'Sesión 1 - Educación Física y Rendimiento',
  grupoSesion: 'Grupo A - 12 Alumnos',
  tiempoLimiteMinutos: null, // configurable

  // Señales seleccionadas para registrar (RF-01)
  senalesActivas: ['fc', 'acc'], // 'fc', 'acc', 'ppg', 'gyro', 'rr'

  // Control de integridad y calidad de datos (RF-13)
  paquetesRecibidos: 0,
  paquetesCorruptos: 0,
  frecuenciaRealMuestreo: 50.1, // Hz reales medidos en Polar Verity Sense
  ultimoPaqueteRaw: {
    hex: '16 4e 02 4b 03 3a 03',
    timestamp: new Date().toISOString(),
    interpretacion: 'Heart Rate: 78 BPM, RR: 820ms, Checksum: OK, 0 bytes corruptos'
  },

  // Dispositivos y sensores conectados (RF-06, RF-09, RF-12)
  // Soporta los 12 dispositivos simultáneos requeridos para clases
  sensores: [
    { id: 1, nombre: 'Polar Sense 01', mac: 'A0:9E:1A:45:B1:01', sujeto: 'Lucas Morales', bateria: 95, conectado: true, fc: 82, rr: 731, acel: { x: 12, y: -45, z: 980 } },
    { id: 2, nombre: 'Polar Sense 02', mac: 'A0:9E:1A:45:B1:02', sujeto: 'Sofía Valenzuela', bateria: 88, conectado: true, fc: 79, rr: 759, acel: { x: -8, y: 30, z: 995 } },
    { id: 3, nombre: 'Polar Sense 03', mac: 'A0:9E:1A:45:B1:03', sujeto: 'Martín Araya', bateria: 92, conectado: true, fc: 91, rr: 659, acel: { x: 85, y: -120, z: 1020 } },
    { id: 4, nombre: 'Polar Sense 04', mac: 'A0:9E:1A:45:B1:04', sujeto: 'Valentina Soto', bateria: 74, conectado: true, fc: 84, rr: 714, acel: { x: 2, y: 15, z: 982 } },
    { id: 5, nombre: 'Polar Sense 05', mac: 'A0:9E:1A:45:B1:05', sujeto: 'Benjamín Castro', bateria: 100, conectado: true, fc: 76, rr: 789, acel: { x: -14, y: -20, z: 975 } },
    { id: 6, nombre: 'Polar Sense 06', mac: 'A0:9E:1A:45:B1:06', sujeto: 'Catalina Muñoz', bateria: 81, conectado: true, fc: 88, rr: 681, acel: { x: 110, y: 80, z: 1050 } },
    { id: 7, nombre: 'Polar Sense 07', mac: 'A0:9E:1A:45:B1:07', sujeto: 'Joaquín González', bateria: 67, conectado: true, fc: 83, rr: 722, acel: { x: -5, y: 10, z: 985 } },
    { id: 8, nombre: 'Polar Sense 08', mac: 'A0:9E:1A:45:B1:08', sujeto: 'Isidora Herrera', bateria: 90, conectado: true, fc: 77, rr: 779, acel: { x: 18, y: -30, z: 990 } },
    { id: 9, nombre: 'Polar Sense 09', mac: 'A0:9E:1A:45:B1:09', sujeto: 'Tomás Silva', bateria: 85, conectado: true, fc: 89, rr: 674, acel: { x: 60, y: 45, z: 1010 } },
    { id: 10, nombre: 'Polar Sense 10', mac: 'A0:9E:1A:45:B1:10', sujeto: 'Florencia Rojas', bateria: 94, conectado: true, fc: 81, rr: 740, acel: { x: -2, y: 5, z: 980 } },
    { id: 11, nombre: 'Polar Sense 11', mac: 'A0:9E:1A:45:B1:11', sujeto: 'Matías Espinoza', bateria: 79, conectado: true, fc: 85, rr: 705, acel: { x: 40, y: -50, z: 1005 } },
    { id: 12, nombre: 'Polar Sense 12', mac: 'A0:9E:1A:45:B1:12', sujeto: 'Emilia Sepúlveda', bateria: 91, conectado: true, fc: 80, rr: 750, acel: { x: 10, y: -15, z: 988 } }
  ],

  // Sensor actualmente seleccionado para vista detallada / smartphone (RF-03, RF-10)
  sensorSeleccionadoId: 1,

  // Búfer de datos históricos para gráficos en tiempo real
  historialGrafico: {
    labels: [],
    fc: [],
    acelX: [],
    acelY: [],
    acelZ: [],
    ppg: []
  }
})

// Variables internas del temporizador
let timerInterval = null
let simuladorInterval = null

/**
 * Inicia la grabación de sesión (RF-02)
 */
export function iniciarGrabacion(opciones = {}) {
  sensorState.grabando = true
  sensorState.tiempoTranscurrido = 0
  sensorState.cronometroTexto = '00:00'
  sensorState.muestrasRegistradas = 0
  sensorState.paquetesRecibidos = 0
  sensorState.paquetesCorruptos = 0

  // Limpiar historial previo de gráficos
  sensorState.historialGrafico.labels = []
  sensorState.historialGrafico.fc = []
  sensorState.historialGrafico.acelX = []
  sensorState.historialGrafico.acelY = []
  sensorState.historialGrafico.acelZ = []
  sensorState.historialGrafico.ppg = []

  // Cronómetro real en segundos
  timerInterval = setInterval(() => {
    sensorState.tiempoTranscurrido++
    const mins = String(Math.floor(sensorState.tiempoTranscurrido / 60)).padStart(2, '0')
    const segs = String(sensorState.tiempoTranscurrido % 60).padStart(2, '0')
    sensorState.cronometroTexto = `${mins}:${segs}`

    if (sensorState.tiempoLimiteMinutos && sensorState.tiempoTranscurrido >= sensorState.tiempoLimiteMinutos * 60) {
      detenerGrabacion()
    }
  }, 1000)

  // Simulación realista en tiempo real (50 Hz para acelerómetro y 1 Hz para FC)
  iniciarSimulacionRealista()
}

/**
 * Detiene la grabación de sesión (RF-02)
 */
export function detenerGrabacion() {
  sensorState.grabando = false
  if (timerInterval) clearInterval(timerInterval)
  if (simuladorInterval) clearInterval(simuladorInterval)
  timerInterval = null
  simuladorInterval = null
}

/**
 * Alterna una señal en la configuración (RF-01)
 */
export function toggleSenal(clave) {
  if (sensorState.grabando) return
  const idx = sensorState.senalesActivas.indexOf(clave)
  if (idx >= 0) {
    if (sensorState.senalesActivas.length > 1) sensorState.senalesActivas.splice(idx, 1)
  } else {
    sensorState.senalesActivas.push(clave)
  }
}

/**
 * Inyección de paquetes reales recibidos del puente o backend
 * 💡 TU COMPAÑERA PUEDE LLAMAR A ESTA FUNCIÓN CUANDO RECIBA DATOS REALES
 */
export function inyectarPaqueteReal(paquete) {
  sensorState.paquetesRecibidos++
  sensorState.muestrasRegistradas += paquete.muestrasCount || 1

  if (paquete.sensorId) {
    const s = sensorState.sensores.find(item => item.id === paquete.sensorId)
    if (s) {
      if (paquete.fc != null) s.fc = paquete.fc
      if (paquete.rr != null) s.rr = paquete.rr
      if (paquete.acel) s.acel = paquete.acel
    }
  }

  if (paquete.hexRaw) {
    sensorState.ultimoPaqueteRaw = {
      hex: paquete.hexRaw,
      timestamp: new Date().toISOString(),
      interpretacion: paquete.interpretacion || 'Paquete validado'
    }
  }
}

/**
 * Generador reactivo de datos simulados fluidos y realistas
 */
function iniciarSimulacionRealista() {
  let contadorPuntos = 0
  const maxPuntosEnPantalla = 30

  simuladorInterval = setInterval(() => {
    contadorPuntos++
    sensorState.paquetesRecibidos += 1
    sensorState.muestrasRegistradas += 50 // Simula ráfaga de 50 muestras de acelerómetro

    const ahora = new Date()
    const tiempoEtiqueta = ahora.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })

    // Variación natural de FC para cada uno de los 12 sensores
    sensorState.sensores.forEach((s, idx) => {
      const delta = (Math.random() - 0.48) * 3
      s.fc = Math.min(160, Math.max(65, Math.round(s.fc + delta)))
      s.rr = Math.round(60000 / s.fc + (Math.random() * 20 - 10))
      s.acel.x = Math.round(Math.sin((contadorPuntos + idx) * 0.3) * 350 + (Math.random() * 40 - 20))
      s.acel.y = Math.round(Math.cos((contadorPuntos + idx) * 0.3) * 480 + (Math.random() * 40 - 20))
      s.acel.z = Math.round(980 + Math.sin((contadorPuntos + idx) * 0.1) * 90 + (Math.random() * 30 - 15))
    })

    // Actualizar historial del sensor enfocado
    const sensorActivo = sensorState.sensores.find(s => s.id === sensorState.sensorSeleccionadoId) || sensorState.sensores[0]

    sensorState.historialGrafico.labels.push(tiempoEtiqueta)
    sensorState.historialGrafico.fc.push(sensorActivo.fc)
    sensorState.historialGrafico.acelX.push(sensorActivo.acel.x)
    sensorState.historialGrafico.acelY.push(sensorActivo.acel.y)
    sensorState.historialGrafico.acelZ.push(sensorActivo.acel.z)
    sensorState.historialGrafico.ppg.push(Math.round(24000 + Math.sin(contadorPuntos * 0.5) * 3000))

    if (sensorState.historialGrafico.labels.length > maxPuntosEnPantalla) {
      sensorState.historialGrafico.labels.shift()
      sensorState.historialGrafico.fc.shift()
      sensorState.historialGrafico.acelX.shift()
      sensorState.historialGrafico.acelY.shift()
      sensorState.historialGrafico.acelZ.shift()
      sensorState.historialGrafico.ppg.shift()
    }

    // Actualizar paquete crudo simulado
    const hexHr = sensorActivo.fc.toString(16).padStart(2, '0')
    sensorState.ultimoPaqueteRaw = {
      hex: `16 ${hexHr} 00 ${Math.floor(Math.random() * 255).toString(16).padStart(2, '0')} 03 3a 03`,
      timestamp: ahora.toISOString(),
      interpretacion: `Polar Sense [${sensorActivo.mac}]: FC = ${sensorActivo.fc} BPM, Acel=[${sensorActivo.acel.x}, ${sensorActivo.acel.y}, ${sensorActivo.acel.z}] mG, Integridad 100% OK`
    }
  }, 1000)
}

// Iniciar con algunos datos en reposo para que los gráficos luzcan vivos desde el primer segundo
for (let i = 20; i > 0; i--) {
  const d = new Date(Date.now() - i * 1000)
  sensorState.historialGrafico.labels.push(d.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }))
  sensorState.historialGrafico.fc.push(Math.round(80 + Math.sin(i / 3) * 4))
  sensorState.historialGrafico.acelX.push(Math.round(Math.sin(i) * 120))
  sensorState.historialGrafico.acelY.push(Math.round(Math.cos(i) * 150))
  sensorState.historialGrafico.acelZ.push(Math.round(980 + Math.sin(i / 2) * 20))
  sensorState.historialGrafico.ppg.push(Math.round(25000 + Math.sin(i) * 2500))
}
