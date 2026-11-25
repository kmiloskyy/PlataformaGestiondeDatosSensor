// Sesión del usuario: el token que entrega /api/auth/login se guarda en localStorage.
import { computed, reactive } from 'vue'

const CLAVE = 'polar_sesion'

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) ?? { token: null, usuario: null } } catch { return { token: null, usuario: null } }
}

export const sesion = reactive(leer())

export const autenticado = () => !!sesion.token

// El profesor administra (graba, ve todo); cualquier otro rol es alumno y solo ve lo suyo.
export const esProfesor = computed(() => sesion.usuario?.rol === 'profesor')

export async function login(correo, clave) {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave }),
  })
  const datos = await r.json().catch(() => null)
  if (!r.ok) throw new Error(datos?.message ?? `Error ${r.status}`)
  sesion.token = datos.token
  sesion.usuario = datos.usuario
  localStorage.setItem(CLAVE, JSON.stringify({ token: datos.token, usuario: datos.usuario }))
}

export function logout() {
  sesion.token = null
  sesion.usuario = null
  localStorage.removeItem(CLAVE)
}

// Sesión vencida o rechazada por la API: se limpia y se fuerza la vuelta al login.
export function cerrarSesion() {
  logout()
  if (location.pathname !== '/login') location.assign('/login')
}
