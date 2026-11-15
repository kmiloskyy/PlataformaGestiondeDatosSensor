# Guía de Integración para el Sensor Polar Verity Sense 🚀

Esta plataforma frontend está construida con una arquitectura **desacoplada y modular**.
Toda la interfaz visual cumple con los requerimientos funcionales **RF-01 al RF-13**, operando con simulación reactiva de alta fidelidad.

---

## 📁 Archivo Clave para la Integración: `src/services/sensorBridge.js`

Tu compañera o tú **solo deben modificar o alimentar este archivo** para pasar de los datos simulados a la extracción real de los sensores Polar Verity Sense. **No es necesario tocar las vistas ni los componentes visuales.**

### 1. Inyectar datos en tiempo real
Cuando el puente BLE (C# / WinRT) o la API de NestJS envíe una lectura o paquete de datos, simplemente invoca:

```javascript
import { inyectarPaqueteReal } from '@/services/sensorBridge.js'

// Ejemplo de paquete recibido del sensor:
inyectarPaqueteReal({
  sensorId: 1, // ID del sensor del 1 al 12
  fc: 85,      // Frecuencia cardíaca en BPM (RF-03)
  rr: 705,     // Intervalo RR en ms (RF-01)
  acel: {      // Acelerometría triaxial a 50 Hz (RF-01, RF-04)
    x: 12,
    y: -45,
    z: 982
  },
  hexRaw: '16 4e 02 4b 03 3a 03', // Trama hexadecimal para inspección de integridad (RF-13)
  interpretacion: 'Polar Verity Sense validado'
})
```

Al llamar a esta función:
* Los gráficos en tiempo real (Chart.js) se actualizarán al instante.
* La tarjeta del alumno en la matriz de 12 sensores cambiará de color según la zona de FC.
* El inspector de integridad de datos en bruto mostrará la trama recibida.

---

### 2. Controlar Inicio y Detención de Grabación
En `sensorBridge.js`, las funciones `iniciarGrabacion()` y `detenerGrabacion()` ya gestionan el cronómetro, conteo de muestras y estados de la interfaz.

Si deseas que estas funciones llamen al endpoint del backend de NestJS:
```javascript
// En src/services/sensorBridge.js:
export async function iniciarGrabacion(opciones = {}) {
  // Descomentar para disparar la sesión en la base de datos de NestJS:
  // await fetch('/api/medicion', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ id_sujeto: opciones.idSujeto, datos: sensorState.senalesActivas })
  // })
}
```

---

## 🎯 Mapeo de Requerimientos Funcionales Implementados en el Frontend

* **RF-01 (Señales a registrar)**: Checkboxes en `views/grabacion.vue` conectadas a `sensorCatalog.js` (FC, PPG, Giroscopio, RR, Acelerómetro).
* **RF-02 (Iniciar/detener grabación)**: Cronómetro dinámico, contador de muestras y control de grabación configurable en `views/grabacion.vue`.
* **RF-03 (Visualización en tiempo real)**: Gráficos dinámicos con `Chart.js` en `src/components/RealtimeChart.vue`.
* **RF-04 (Almacenamiento único)**: Búfer de datos integrado en `sensorBridge.js` con soporte para FC y ráfagas de 50 Hz de acelerometría.
* **RF-05 (Exportar datos)**: Generación y descarga real en el cliente de archivos **CSV**, reportes imprimibles/PDF y Dashboard JSON en `src/services/exportService.js`.
* **RF-06 & RF-12 (Identificación y vinculación)**: Tabla de gestión y asignación de sensores por dirección MAC y Bluetooth ID en `views/dispositivos.vue`.
* **RF-07 (Informe individual)**: Pestaña de análisis de zonas cardíacas y métricas en `src/components/ReportModal.vue`.
* **RF-08 (Filtro de momentos específicos)**: Sliders de recorte temporal (*timeline scrubber*) para procesar tramos específicos en `ReportModal.vue`.
* **RF-09 (Matriz multidispositivo)**: Grilla en tiempo real para 12 sensores simultáneos en `src/components/MultiDeviceGrid.vue`.
* **RF-10 (Modo Smartphone / Remoto)**: Vista responsive móvil para alumnos en estudios domiciliarios en `views/grabacion.vue`.
* **RF-11 (Reporte de clase)**: Tabla consolidada para el profesor con promedios y esfuerzo grupal en `ReportModal.vue`.
* **RF-13 (Integridad de datos crudos)**: Tarjeta de inspección de bytes hexadecimales, frecuencia medida y descarte de corrupción en `src/components/RawPacketInspector.vue`.
