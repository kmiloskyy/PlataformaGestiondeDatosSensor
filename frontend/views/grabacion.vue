<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { sensorState, iniciarGrabacion, detenerGrabacion, toggleSenal } from '../src/services/sensorBridge.js'
import { SENSORES_DISPONIBLES } from '../src/services/sensorCatalog.js'
import RealtimeChart from '../src/components/RealtimeChart.vue'
import MultiDeviceGrid from '../src/components/MultiDeviceGrid.vue'
import RawPacketInspector from '../src/components/RawPacketInspector.vue'

function toggleGrabar() {
  if (sensorState.grabando) {
    detenerGrabacion()
  } else {
    iniciarGrabacion()
  }
}

const sensorEnfocado = computed(() => {
  return sensorState.sensores.find(s => s.id === sensorState.sensorSeleccionadoId) || sensorState.sensores[0]
})

// Dataset para gráfico de FC
const datasetsFC = computed(() => [
  {
    label: `FC (${sensorEnfocado.value.sujeto})`,
    data: [...sensorState.historialGrafico.fc],
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderWidth: 2.5,
    fill: true,
    tension: 0.3,
    pointRadius: 2
  }
])

// Dataset para gráfico de Acelerómetro (3 ejes)
const datasetsAcel = computed(() => [
  {
    label: 'Eje X',
    data: [...sensorState.historialGrafico.acelX],
    borderColor: '#ef4444',
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.2
  },
  {
    label: 'Eje Y',
    data: [...sensorState.historialGrafico.acelY],
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.2
  },
  {
    label: 'Eje Z (Gravedad ~980 mG)',
    data: [...sensorState.historialGrafico.acelZ],
    borderColor: '#06b6d4',
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.2
  }
])
</script>

<template>
  <main class="grabacion-view">

    <!-- Encabezado y Selector de Modos (RF-09, RF-10) -->
    <div class="page-header">
      <div>
        <h1>Grabación y Monitoreo Fisiológico en Vivo</h1>
        <p class="subtitulo">
          Recepción y registro de datos brutos del sensor Polar Verity Sense vía Bluetooth LE.
        </p>
      </div>

      <!-- Selector de Modo de Pantalla -->
      <div class="modo-selector">
        <button
          class="btn-modo"
          :class="{ activo: sensorState.modoVista === 'clase' }"
          @click="sensorState.modoVista = 'clase'"
        >
           Modo Clase (12 Dispositivos)
        </button>
        <button
          class="btn-modo"
          :class="{ activo: sensorState.modoVista === 'individual' }"
          @click="sensorState.modoVista = 'individual'"
        >
           Gráficos en Vivo
        </button>
        <button
          class="btn-modo"
          :class="{ activo: sensorState.modoVista === 'movil' }"
          @click="sensorState.modoVista = 'movil'"
        >
           Smartphone / Remoto
        </button>
      </div>
    </div>

    <!-- Panel Superior: Controles de Grabación y Parámetros (RF-01, RF-02) -->
    <div class="layout-controles">

      <!-- Tarjeta 1: Cronómetro e Iniciar/Detener -->
      <section class="card card-timer">
        <div class="estado-badge" :class="sensorState.grabando ? 'activo' : 'inactivo'">
          {{ sensorState.grabando ? '🔴 Grabando en tiempo real' : '⏸ En espera' }}
        </div>
        <div class="cronometro">{{ sensorState.cronometroTexto }}</div>

        <button
          class="btn-action-grabar"
          :class="{ 'btn-detener': sensorState.grabando }"
          @click="toggleGrabar"
        >
          {{ sensorState.grabando ? '⏹ Detener Grabación' : '⏺ Iniciar Grabación' }}
        </button>

        <div class="stats-grabacion">
          <span>Muestras: <strong>{{ sensorState.muestrasRegistradas }}</strong></span>
          <span>Buffer: <strong class="ok">Sincronizado</strong></span>
        </div>
      </section>

      <!-- Tarjeta 2: Configuración de Señales a Registrar (RF-01) -->
      <section class="card card-senales">
        <div class="card-header-clean">
          <h3>Señales a Registrar (RF-01)</h3>
          <span class="hint">Elige qué flujos capturar</span>
        </div>

        <div class="senales-grid">
          <label
            v-for="s in SENSORES_DISPONIBLES"
            :key="s.k"
            class="senal-checkbox-card"
            :class="{ seleccionada: sensorState.senalesActivas.includes(s.k) }"
          >
            <input
              type="checkbox"
              :checked="sensorState.senalesActivas.includes(s.k)"
              :disabled="sensorState.grabando"
              @change="toggleSenal(s.k)"
            />
            <div class="senal-info">
              <span class="senal-nombre">{{ s.icono }} {{ s.nombre }}</span>
              <span class="senal-freq">{{ s.frecuencia }} · {{ s.unidad }}</span>
            </div>
          </label>
        </div>
      </section>

      <!-- Tarjeta 3: Configuración de Sesión y Alumno -->
      <section class="card card-metadata">
        <div class="card-header-clean">
          <h3>Parámetros de la Sesión</h3>
          <span class="hint">Identificación y almacenamiento</span>
        </div>

        <div class="form-group">
          <label>Título de la Sesión
            <input type="text" v-model="sensorState.tituloSesion" :disabled="sensorState.grabando" />
          </label>
          <label>Grupo / Clase
            <input type="text" v-model="sensorState.grupoSesion" :disabled="sensorState.grabando" />
          </label>
          <label>Sensor Principal Enfocado
            <select v-model="sensorState.sensorSeleccionadoId">
              <option v-for="s in sensorState.sensores" :key="s.id" :value="s.id">
                #{{ s.id.toString().padStart(2, '0') }} - {{ s.nombre }} [{{ s.mac }}] - {{ s.sujeto }}
              </option>
            </select>
          </label>
        </div>
      </section>

    </div>

    <!-- VISTA 1: MODO CLASE MULTIDISPOSITIVO (RF-09, RF-11) -->
    <div v-if="sensorState.modoVista === 'clase'">
      <MultiDeviceGrid @seleccionar-sensor="id => { sensorState.sensorSeleccionadoId = id; sensorState.modoVista = 'individual'; }" />
    </div>

    <!-- VISTA 2: GRÁFICOS EN TIEMPO REAL (RF-03, RF-04) -->
    <div v-if="sensorState.modoVista === 'individual'" class="seccion-graficos">
      <div class="graficos-banner-info">
        <div>
          <h3>Visualización en Tiempo Real: {{ sensorEnfocado.sujeto }}</h3>
          <span class="badge-mac">Sensor: {{ sensorEnfocado.nombre }} · MAC: {{ sensorEnfocado.mac }} · Batería: {{ sensorEnfocado.bateria }}%</span>
        </div>
        <div class="fc-live-pill">
          <span class="fc-num">{{ sensorEnfocado.fc }}</span>
          <span class="fc-txt">BPM ACTUAL</span>
        </div>
      </div>

      <div class="graficos-grid">
        <RealtimeChart
          titulo="Curva de Frecuencia Cardíaca (BPM fluctuando en vivo)"
          :labels="sensorState.historialGrafico.labels"
          :datasets="datasetsFC"
          :yMin="50"
          :yMax="180"
          unidad="BPM"
        />

        <RealtimeChart
          titulo="Acelerometría Triaxial (X, Y, Z a 50 Hz en mG)"
          :labels="sensorState.historialGrafico.labels"
          :datasets="datasetsAcel"
          :yMin="-800"
          :yMax="1500"
          unidad="mG"
        />
      </div>
    </div>

    <!-- VISTA 3: MODO SMARTPHONE / REMOTO (RF-10) -->
    <div v-if="sensorState.modoVista === 'movil'" class="seccion-movil">
      <div class="smartphone-frame">
        <div class="screen-header">
          <span class="hora-mock">09:41</span>
          <span class="icons-mock">📶 🔋 98%</span>
        </div>

        <div class="mobile-app-content">
          <div class="mobile-pill-status">
            <span class="punto-verde"></span> Conectado a Polar Verity Sense
          </div>

          <h2 class="mobile-alumno">{{ sensorEnfocado.sujeto }}</h2>
          <p class="mobile-mac">ID: {{ sensorEnfocado.mac }}</p>

          <div class="mobile-bpm-circle">
            <span class="m-bpm">{{ sensorEnfocado.fc }}</span>
            <span class="m-label">Pulsaciones (BPM)</span>
          </div>

          <div class="mobile-stats-row">
            <div>
              <span class="val">{{ sensorEnfocado.rr }} ms</span>
              <span class="lbl">Intervalo RR</span>
            </div>
            <div>
              <span class="val">{{ sensorState.cronometroTexto }}</span>
              <span class="lbl">Tiempo</span>
            </div>
            <div>
              <span class="val">Baja</span>
              <span class="lbl">Carga</span>
            </div>
          </div>

          <button
            class="btn-mobile-rec"
            :class="{ active: sensorState.grabando }"
            @click="toggleGrabar"
          >
            {{ sensorState.grabando ? '⏹ Detener y Enviar a Servidor' : '⏺ Iniciar Monitoreo en Domicilio' }}
          </button>
        </div>
      </div>

      <div class="movil-explicacion">
        <h3>Monitoreo Remoto & Estudios en Domicilio</h3>
        <p>
          Este diseño responsive simula la experiencia en el <strong>smartphone del alumno o paciente</strong>. Permite conectar un sensor individual para estudios de sueño o salud rural.
        </p>
        <p>
          Los datos se almacenan localmente en el teléfono (IndexedDB) para no saturar el servidor con streaming continuo y se sincronizan al finalizar la sesión.
        </p>
      </div>
    </div>

    <!-- Widget de Inspección de Paquetes en Bruto (RF-13) -->
    <RawPacketInspector />

  </main>
</template>

<style scoped>
.grabacion-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.2rem 1.5rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-bottom: 1.8rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.subtitulo {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.modo-selector {
  display: flex;
  background: #e2e8f0;
  padding: 0.3rem;
  border-radius: 10px;
  gap: 0.3rem;
}

.btn-modo {
  padding: 0.5rem 0.9rem;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-modo.activo {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

.layout-controles {
  display: grid;
  grid-template-columns: 240px 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 900px) {
  .layout-controles { grid-template-columns: 1fr; }
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.2rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.card-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.8rem;
}

.estado-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.8rem;
  border-radius: 20px;
}
.estado-badge.activo { background: #fee2e2; color: #b91c1c; }
.estado-badge.inactivo { background: #f1f5f9; color: #64748b; }

.cronometro {
  font-size: 3rem;
  font-weight: 800;
  color: #1a1a2e;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.btn-action-grabar {
  background: #1a1a2e;
  color: #ffffff;
  border: none;
  padding: 0.7rem 1.4rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}
.btn-action-grabar:hover { background: #e94560; }
.btn-action-grabar.btn-detener { background: #e94560; }
.btn-action-grabar.btn-detener:hover { background: #c73652; }

.stats-grabacion {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.75rem;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.6rem;
}
.stats-grabacion .ok { color: #10b981; }

.card-header-clean {
  margin-bottom: 0.8rem;
}
.card-header-clean h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
}
.card-header-clean .hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.senales-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.senal-checkbox-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 0.8rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.senal-checkbox-card.seleccionada {
  background: #eff6ff;
  border-color: #93c5fd;
}

.senal-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.82rem;
}
.senal-nombre { font-weight: 600; color: #1e293b; }
.senal-freq { color: #64748b; font-size: 0.75rem; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
}

input[type="text"], select {
  padding: 0.5rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.85rem;
  background: #fafafa;
}

.seccion-graficos {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.graficos-banner-info {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.graficos-banner-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.badge-mac {
  font-size: 0.8rem;
  color: #64748b;
}

.fc-live-pill {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 0.4rem 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fc-live-pill .fc-num {
  font-size: 1.8rem;
  font-weight: 800;
  color: #e94560;
  line-height: 1;
}

.fc-live-pill .fc-txt {
  font-size: 0.65rem;
  font-weight: 700;
  color: #9f1239;
}

.graficos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}

@media (max-width: 768px) {
  .graficos-grid { grid-template-columns: 1fr; }
}

.seccion-movil {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.smartphone-frame {
  width: 300px;
  background: #0f172a;
  border-radius: 36px;
  padding: 12px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.25);
  border: 4px solid #334155;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 0.72rem;
  padding: 6px 12px 10px;
}

.mobile-app-content {
  background: #f8fafc;
  border-radius: 26px;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.8rem;
}

.mobile-pill-status {
  background: #ecfdf5;
  color: #065f46;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.punto-verde {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
}

.mobile-alumno {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.mobile-mac {
  margin: -0.5rem 0 0.5rem;
  font-size: 0.72rem;
  color: #64748b;
  font-family: monospace;
}

.mobile-bpm-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 5px solid #e94560;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.15);
}

.m-bpm {
  font-size: 2.8rem;
  font-weight: 800;
  color: #e94560;
  line-height: 1;
}

.m-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.mobile-stats-row {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin: 0.5rem 0;
  background: #fff;
  padding: 0.6rem;
  border-radius: 10px;
}

.mobile-stats-row .val {
  display: block;
  font-weight: 700;
  font-size: 0.85rem;
  color: #1e293b;
}

.mobile-stats-row .lbl {
  font-size: 0.65rem;
  color: #94a3b8;
}

.btn-mobile-rec {
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  width: 100%;
}
.btn-mobile-rec.active { background: #e94560; }

.movil-explicacion {
  max-width: 400px;
}
.movil-explicacion h3 {
  font-size: 1.3rem;
  color: #0f172a;
  margin-bottom: 0.8rem;
}
.movil-explicacion p {
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.6;
}
</style>
