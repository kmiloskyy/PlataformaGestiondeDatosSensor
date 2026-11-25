import { computed, reactive, watch } from 'vue'
import { api } from './api.js'

export const store = reactive({
  estado: null,
  ultimo: null,
  sesiones: null,
  sujetos: null,
  sensores: null,
  lecturasActivas: [],
  errores: {},
})

let guardadas
try { guardadas = JSON.parse(localStorage.getItem('asignacionesPolar')) } catch { /* almacenamiento no disponible */ }
export const asignaciones = reactive(guardadas && typeof guardadas === 'object' && !Array.isArray(guardadas) ? guardadas : {})
watch(asignaciones, () => {
  try { localStorage.setItem('asignacionesPolar', JSON.stringify(asignaciones)) } catch { /* almacenamiento no disponible */ }
})

export function cambiarAsignacion(mac, cambio) {
  asignaciones[mac] = { ...asignaciones[mac], ...cambio }
}

let versionEstado = 0
export function aplicarEstado(estado) {
  versionEstado++
  store.estado = estado
  delete store.errores.estado
}

async function refrescar(recurso, args, sigueActivo) {
  const version = versionEstado
  try {
    const resultado = await api[recurso](...args)
    if (!sigueActivo() || (recurso === 'estado' && version !== versionEstado)) return
    store[recurso] = resultado
    delete store.errores[recurso]
  } catch (error) {
    if (sigueActivo() && (recurso !== 'estado' || version === versionEstado)) store.errores[recurso] = error.message
  }
}

export function sondear(recurso, intervalo = 1000, ...args) {
  let detenido = false
  let siguiente
  async function consultar() {
    await refrescar(recurso, args, () => !detenido)
    if (!detenido) siguiente = setTimeout(consultar, intervalo)
  }
  consultar()
  return () => {
    detenido = true
    clearTimeout(siguiente)
  }
}

export const puente = computed(() => store.estado?.puente)
export const puentes = computed(() => store.estado?.puentes ?? [])
export const sesionesActivas = computed(() => store.estado?.sesiones_activas ?? [])
export const disponibles = computed(() => store.errores.estado ? [] : puentes.value.filter((p) => p.disponible))
export const puenteDisponible = computed(() => !store.errores.estado &&
  (disponibles.value.length > 0 || puente.value?.disponible === true))

export const estadoPuente = computed(() => {
  if (store.errores.estado) return 'API sin conexión'
  if (!store.estado) return 'Consultando el puente…'
  if (disponibles.value.length) return `${disponibles.value.length} ${disponibles.value.length === 1 ? 'sensor en línea' : 'sensores en línea'}`
  return puenteDisponible.value ? 'Puente en línea' : 'Puente sin conexión'
})
