// Cliente de la API del backend (Nest). Todas las rutas cuelgan de /api.
import { cerrarSesion, sesion } from './auth.js'

const cabeceras = (extra = {}) => (sesion.token ? { ...extra, Authorization: `Bearer ${sesion.token}` } : extra)

// Un 401 con sesión guardada significa token vencido o inválido: se cierra la sesión y se vuelve al login.
function sesionVencida(r) {
  if (r.status === 401 && sesion.token) cerrarSesion()
}

async function pedir(url, opciones = {}) {
  const r = await fetch(url, { ...opciones, headers: cabeceras(opciones.headers) })
  sesionVencida(r)
  const datos = await r.json().catch(() => null)
  if (!r.ok) throw new Error(datos?.errores?.join('\n') ?? datos?.message ?? `Error ${r.status}`)
  if (datos == null) throw new Error('La API no devolvió una respuesta JSON.')
  return datos
}
const post = (url, cuerpo) =>
  pedir(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })

// Los enlaces <a href> no pueden llevar el token, así que las descargas se piden con fetch y se guardan como archivo.
async function descargar(url, nombre) {
  const r = await fetch(url, { headers: cabeceras() })
  sesionVencida(r)
  if (!r.ok) throw new Error(`No se pudo descargar (${r.status})`)
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(await r.blob())
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

export const api = {
  estado: () => pedir('/api/medicion'),
  iniciar: (asignaciones, datos, nombre_sesion) => post('/api/medicion', { asignaciones, datos, nombre_sesion }),
  detener: () => post('/api/medicion', { midiendo: false }),
  sujetos: () => pedir('/api/sujetos'),
  sensores: () => pedir('/api/sensores'),
  sesiones: () => pedir('/api/sesiones'),
  ultimo: (id) => pedir(`/api/ultimo?id_sesion=${id}`),
  lecturasActivas: () => pedir('/api/lecturas-activas'),
  series: (id, desde, hasta, max = 1500) =>
    pedir(`/api/sesiones/${id}/series?desde=${new Date(desde).toISOString()}&hasta=${new Date(hasta).toISOString()}&max=${max}`),
  descargarJson: (id) => descargar(`/api/sesiones/${id}?descargar=1`, `sesion-${id}.json`),
  descargarCsv: (id, dato) => descargar(`/api/sesiones/${id}/csv/${dato}`, `sesion-${id}-${dato}.csv`),
}
