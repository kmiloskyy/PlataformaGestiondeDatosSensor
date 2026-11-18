// Cliente de la API del backend (Nest). Todas las rutas cuelgan de /api.
async function pedir(url, opciones) {
  const r = await fetch(url, opciones)
  const datos = await r.json().catch(() => null)
  if (!r.ok) throw new Error((datos?.errores ?? ['Error ' + r.status]).join('\n'))
  return datos
}
const post = (url, cuerpo) =>
  pedir(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })

export const api = {
  estado: () => pedir('/api/medicion'),
  iniciar: (id_sujeto, datos) => post('/api/medicion', { id_sujeto, datos }),
  detener: () => post('/api/medicion', { midiendo: false }),
  sujetos: () => pedir('/api/sujetos'),
  sesiones: () => pedir('/api/sesiones'),
  ultimo: () => pedir('/api/ultimo'),
  series: (id, desde, hasta, max = 1500) =>
    pedir(`/api/sesiones/${id}/series?desde=${new Date(desde).toISOString()}&hasta=${new Date(hasta).toISOString()}&max=${max}`),
  urlJson: (id) => `/api/sesiones/${id}?descargar=1`,
  urlVerJson: (id) => `/api/sesiones/${id}`,
  urlCsv: (id, dato) => `/api/sesiones/${id}/csv/${dato}`,
}
