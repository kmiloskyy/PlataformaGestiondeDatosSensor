import { computed, reactive } from 'vue'
import { api } from './api.js'

export const store = reactive({
  estado: null,
  ultimo: null,
  sesiones: null,
  sujetos: null,
  sensores: null,
  errores: {},
})

let versionEstado = 0
export function aplicarEstado(estado) {
  versionEstado++
  store.estado = estado
  delete store.errores.estado
}

async function refrescar(recurso) {
  const version = versionEstado
  try {
    const resultado = await api[recurso]()
    if (recurso === 'estado' && version !== versionEstado) return
    store[recurso] = resultado
    delete store.errores[recurso]
  } catch (error) {
    if (recurso !== 'estado' || version === versionEstado) store.errores[recurso] = error.message
  }
}

export function sondear(recurso, intervalo = 1000) {
  let detenido = false
  let siguiente
  async function consultar() {
    await refrescar(recurso)
    if (!detenido) siguiente = setTimeout(consultar, intervalo)
  }
  consultar()
  return () => {
    detenido = true
    clearTimeout(siguiente)
  }
}

export const puente = computed(() => store.estado?.puente)
export const puenteDisponible = computed(() => !store.errores.estado &&
  puente.value?.visto_hace_s != null && puente.value.visto_hace_s <= 5)

export const estadoPuente = computed(() => {
  if (store.errores.estado) return 'API sin conexión'
  if (!store.estado) return 'Consultando el puente…'
  return puenteDisponible.value ? 'Puente en línea' : 'Puente sin conexión'
})
