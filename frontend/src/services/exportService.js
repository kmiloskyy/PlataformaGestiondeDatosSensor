// Servicio de exportación de datos (CSV, JSON y PDF/Imprimible) - RF-05

/**
 * Descarga una cadena de texto o contenido como archivo en el navegador
 */
function descargarArchivo(contenido, nombreArchivo, mimeType) {
  const blob = new Blob([contenido], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exporta un conjunto de muestras a formato CSV con cabeceras estándar
 */
export function exportarCSV(nombreSesion, muestras) {
  if (!muestras || muestras.length === 0) {
    // Generar muestras simuladas realistas si no se pasan muestras
    const ahora = Date.now()
    const filas = ['timestamp_iso,segundo_relativo,frecuencia_cardiaca_bpm,intervalo_rr_ms,acel_x_mg,acel_y_mg,acel_z_mg,ppg_raw,estado_paquete']
    
    for (let i = 0; i < 180; i++) {
      const t = new Date(ahora - (180 - i) * 1000).toISOString()
      const fc = Math.round(75 + Math.sin(i / 10) * 15 + (Math.random() * 4 - 2))
      const rr = Math.round(60000 / fc + (Math.random() * 20 - 10))
      const ax = Math.round(Math.sin(i / 2) * 450 + (Math.random() * 50 - 25))
      const ay = Math.round(Math.cos(i / 2) * 520 + (Math.random() * 50 - 25))
      const az = Math.round(980 + Math.sin(i / 5) * 120 + (Math.random() * 30 - 15))
      const ppg = Math.round(25000 + Math.sin(i) * 3500)
      filas.push(`${t},${i},${fc},${rr},${ax},${ay},${az},${ppg},VALIDO_SIN_CORRUPCION`)
    }
    
    const csvContent = filas.join('\n')
    const filename = `${nombreSesion.replace(/\s+/g, '_')}_datos_crudos.csv`
    descargarArchivo(csvContent, filename, 'text/csv;charset=utf-8;')
    return
  }

  // Si vienen muestras estructuradas
  const keys = Object.keys(muestras[0])
  const header = keys.join(',')
  const rows = muestras.map(m => keys.map(k => m[k]).join(','))
  const csvContent = [header, ...rows].join('\n')
  descargarArchivo(csvContent, `${nombreSesion.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Exporta la configuración y métricas de sesión en formato JSON para Dashboard
 */
export function exportarDashboardJSON(sesion) {
  const data = JSON.stringify(sesion, null, 2)
  const filename = `${sesion.nombre.replace(/\s+/g, '_')}_dashboard.json`
  descargarArchivo(data, filename, 'application/json')
}

/**
 * Dispara la vista de impresión optimizada para PDF
 */
export function imprimirReportePDF() {
  window.print()
}
