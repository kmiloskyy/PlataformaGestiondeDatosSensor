// Estado compartido y sondeo periódico del backend (el puente y la API cambian solos, la pantalla se mantiene al día).
import { reactive } from 'vue'
import { api } from './api.js'

export const store = reactive({
  estado: { midiendo: false, datos: [], puente: {} },
  ultimo: null,
  sesiones: [],
  sujetos: [],
  sinConexion: false,
})

async function intentar(fn) {
  try { await fn(); store.sinConexion = false } catch { store.sinConexion = true }
}
export const refrescarEstado = () => intentar(async () => { store.estado = await api.estado() })
export const refrescarUltimo = () => intentar(async () => { store.ultimo = await api.ultimo() })
export const refrescarSesiones = () => intentar(async () => { store.sesiones = await api.sesiones() })
export const refrescarSujetos = () => intentar(async () => { store.sujetos = await api.sujetos() })

let timers = []
export function iniciarSondeo() {
  refrescarEstado(); refrescarUltimo(); refrescarSesiones(); refrescarSujetos()
  timers = [
    setInterval(() => { refrescarEstado(); refrescarUltimo() }, 1000),
    setInterval(refrescarSesiones, 2000),
  ]
}
export function detenerSondeo() { timers.forEach(clearInterval); timers = [] }
