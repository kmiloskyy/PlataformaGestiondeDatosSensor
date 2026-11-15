<script setup>
import { ref, computed } from 'vue'
import { exportarCSV, exportarDashboardJSON, imprimirReportePDF } from '../services/exportService.js'

const props = defineProps({
  sesion: { type: Object, required: true },
  mostrar: { type: Boolean, default: false }
})

const emit = defineEmits(['cerrar'])

// Pestaña activa en el reporte: 'individual' (RF-07) o 'clase' (RF-11)
const tabActiva = ref('individual')

// Filtro de momentos específicos de la sesión (RF-08)
const duracionMinutos = computed(() => props.sesion.duracionMin || 30)
const rangoInicio = ref(0)
const rangoFin = ref(30)

// Alumnos simulados de la sesión de clase (RF-11)
const alumnosClase = ref([
  { nombre: 'Lucas Morales', fcProm: 138, fcMax: 168, zona: 'Cardio Intenso', esfuerzo: '85%' },
  { nombre: 'Sofía Valenzuela', fcProm: 124, fcMax: 152, zona: 'Aeróbico', esfuerzo: '72%' },
  { nombre: 'Martín Araya', fcProm: 145, fcMax: 174, zona: 'Anaeróbico', esfuerzo: '92%' },
  { nombre: 'Valentina Soto', fcProm: 129, fcMax: 158, zona: 'Aeróbico', esfuerzo: '76%' },
  { nombre: 'Benjamín Castro', fcProm: 118, fcMax: 144, zona: 'Quema Grasa', esfuerzo: '65%' },
  { nombre: 'Catalina Muñoz', fcProm: 141, fcMax: 170, zona: 'Cardio Intenso', esfuerzo: '88%' },
  { nombre: 'Joaquín González', fcProm: 132, fcMax: 160, zona: 'Aeróbico', esfuerzo: '79%' },
  { nombre: 'Isidora Herrera', fcProm: 122, fcMax: 148, zona: 'Aeróbico', esfuerzo: '70%' },
  { nombre: 'Tomás Silva', fcProm: 147, fcMax: 177, zona: 'Anaeróbico', esfuerzo: '94%' },
  { nombre: 'Florencia Rojas', fcProm: 126, fcMax: 154, zona: 'Aeróbico', esfuerzo: '73%' },
  { nombre: 'Matías Espinoza', fcProm: 135, fcMax: 163, zona: 'Aeróbico', esfuerzo: '81%' },
  { nombre: 'Emilia Sepúlveda', fcProm: 120, fcMax: 146, zona: 'Quema Grasa', esfuerzo: '68%' }
])

const fcPromedioClase = computed(() => {
  const sum = alumnosClase.value.reduce((acc, a) => acc + a.fcProm, 0)
  return Math.round(sum / alumnosClase.value.length)
})

function descargarCSV() {
  exportarCSV(props.sesion.nombre, null)
}

function descargarJSON() {
  exportarDashboardJSON(props.sesion)
}

function imprimir() {
  imprimirReportePDF()
}
</script>

<template>
  <div v-if="mostrar" class="modal-backdrop" @click.self="$emit('cerrar')">
    <div class="modal-card">

      <!-- Encabezado del reporte -->
      <div class="modal-header">
        <div>
          <span class="badge-tipo">{{ sesion.tipo || 'Sesión Multidispositivo' }}</span>
          <h2>{{ sesion.nombre }}</h2>
          <p class="sub-header">
             {{ sesion.fecha }} · {{ sesion.duracionMin }} minutos ·  {{ sesion.sensoresCount || 12 }} Sensores Polar Verity Sense
          </p>
        </div>
        <button class="btn-cerrar" @click="$emit('cerrar')">✕</button>
      </div>

      <!-- Barra de herramientas: Tabs y Exportaciones (RF-05) -->
      <div class="modal-toolbar">
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ activo: tabActiva === 'individual' }"
            @click="tabActiva = 'individual'"
          >
             Informe Individual 
          </button>
          <button
            class="tab-btn"
            :class="{ activo: tabActiva === 'clase' }"
            @click="tabActiva = 'clase'"
          >
             Reporte de Clase / Grupo
          </button>
        </div>

        <div class="export-actions">
          <button class="btn-exp btn-csv" @click="descargarCSV">⬇ Descargar CSV</button>
          <button class="btn-exp btn-pdf" @click="imprimir"> Imprimir / PDF</button>
          <button class="btn-exp btn-json" @click="descargarJSON"> Dashboard JSON</button>
        </div>
      </div>

      <!-- Control de filtro de tramos / momentos específicos (RF-08) -->
      <div class="timeline-filtro-box">
        <div class="filtro-title">
          <span> <strong>Filtro de Segmentos Temporales</strong></span>
          <span class="rango-texto">
            Procesando desde el minuto <strong>{{ rangoInicio }}:00</strong> hasta <strong>{{ rangoFin }}:00</strong>
            ({{ rangoFin - rangoInicio }} min seleccionados)
          </span>
        </div>
        <div class="sliders-row">
          <label>
            Inicio:
            <input type="range" min="0" :max="duracionMinutos - 1" v-model.number="rangoInicio" />
            <span>{{ rangoInicio }}m</span>
          </label>
          <label>
            Fin:
            <input type="range" :min="rangoInicio + 1" :max="duracionMinutos" v-model.number="rangoFin" />
            <span>{{ rangoFin }}m</span>
          </label>
        </div>
      </div>

      <!-- Contenido de la pestaña: INFORME INDIVIDUAL (RF-07) -->
      <div v-if="tabActiva === 'individual'" class="tab-content">
        <div class="resumen-metrics-grid">
          <div class="metric-card">
            <span class="m-val">{{ Math.round(136 + (rangoInicio % 5)) }} <small>BPM</small></span>
            <span class="m-lbl">FC Media en Segmento</span>
          </div>
          <div class="metric-card">
            <span class="m-val" style="color: #ef4444;">172 <small>BPM</small></span>
            <span class="m-lbl">FC Máxima Registrada</span>
          </div>
          <div class="metric-card">
            <span class="m-val" style="color: #10b981;">68 <small>BPM</small></span>
            <span class="m-lbl">FC Mínima de Reposo</span>
          </div>
          <div class="metric-card">
            <span class="m-val" style="color: #3b82f6;">42 <small>ms</small></span>
            <span class="m-lbl">Variabilidad RMSSD (RR)</span>
          </div>
        </div>

        <div class="zonas-card">
          <h4>Distribución por Zonas de Frecuencia Cardíaca</h4>
          <div class="zonas-barras">
            <div class="zona-row">
              <span class="zona-tag">Zona 5: Máxima (>165 BPM)</span>
              <div class="prog-wrapper"><div class="prog-bar z5" style="width: 18%"></div></div>
              <span class="zona-pct">18%</span>
            </div>
            <div class="zona-row">
              <span class="zona-tag">Zona 4: Anaeróbica (148 - 165)</span>
              <div class="prog-wrapper"><div class="prog-bar z4" style="width: 34%"></div></div>
              <span class="zona-pct">34%</span>
            </div>
            <div class="zona-row">
              <span class="zona-tag">Zona 3: Aeróbica (130 - 147)</span>
              <div class="prog-wrapper"><div class="prog-bar z3" style="width: 32%"></div></div>
              <span class="zona-pct">32%</span>
            </div>
            <div class="zona-row">
              <span class="zona-tag">Zona 2: Quema Grasa (112 - 129)</span>
              <div class="prog-wrapper"><div class="prog-bar z2" style="width: 12%"></div></div>
              <span class="zona-pct">12%</span>
            </div>
            <div class="zona-row">
              <span class="zona-tag">Zona 1: Reposo (&lt;112 BPM)</span>
              <div class="prog-wrapper"><div class="prog-bar z1" style="width: 4%"></div></div>
              <span class="zona-pct">4%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido de la pestaña: REPORTE DE CLASE / GRUPO (RF-11) -->
      <div v-if="tabActiva === 'clase'" class="tab-content">
        <div class="resumen-clase-banner">
          <div>
            <span class="lbl-banner">Promedio General del Grupo:</span>
            <h3>{{ fcPromedioClase }} BPM</h3>
          </div>
          <div>
            <span class="lbl-banner">Intensidad Media de la Clase:</span>
            <span class="tag-cardio">Aeróbico Dinámico (78% FCM)</span>
          </div>
          <div>
            <span class="lbl-banner">Alumnos Evaluados:</span>
            <span><strong>12 / 12</strong> Sensores Sincronizados</span>
          </div>
        </div>

        <div class="tabla-wrapper">
          <table class="tabla-clase">
            <thead>
              <tr>
                <th>Alumno / Sujeto</th>
                <th>FC Media (BPM)</th>
                <th>FC Máx (BPM)</th>
                <th>Zona de Esfuerzo</th>
                <th>Carga Relativa</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in alumnosClase" :key="a.nombre">
                <td><strong>{{ a.nombre }}</strong></td>
                <td>{{ a.fcProm }}</td>
                <td>{{ a.fcMax }}</td>
                <td><span class="pill-zona">{{ a.zona }}</span></td>
                <td>
                  <div class="barra-esfuerzo">
                    <div class="fill" :style="{ width: a.esfuerzo }"></div>
                    <span class="val">{{ a.esfuerzo }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1.2rem;
}

.badge-tipo {
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.modal-header h2 {
  margin: 0.4rem 0 0.2rem;
  font-size: 1.5rem;
  color: #0f172a;
}

.sub-header {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.btn-cerrar {
  background: #f1f5f9;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  color: #475569;
}

.modal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1.2rem 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.activo {
  background: #1a1a2e;
  color: #ffffff;
  border-color: #1a1a2e;
}

.export-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-exp {
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}
.btn-exp:hover { opacity: 0.9; }
.btn-csv { background: #10b981; color: #fff; }
.btn-pdf { background: #e94560; color: #fff; }
.btn-json { background: #0284c7; color: #fff; }

.timeline-filtro-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}

.filtro-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
  color: #334155;
}

.sliders-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.sliders-row label {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.sliders-row input[type="range"] {
  flex: 1;
}

.resumen-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.m-val {
  font-size: 1.7rem;
  font-weight: 800;
  color: #0f172a;
}
.m-val small { font-size: 0.8rem; color: #64748b; }
.m-lbl { font-size: 0.78rem; color: #64748b; font-weight: 600; }

.zonas-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.2rem;
}

.zonas-card h4 {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  color: #1e293b;
}

.zonas-barras {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.zona-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.82rem;
}

.zona-tag { width: 220px; color: #475569; }
.prog-wrapper { flex: 1; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
.prog-bar { height: 100%; border-radius: 6px; }
.prog-bar.z5 { background: #ef4444; }
.prog-bar.z4 { background: #f97316; }
.prog-bar.z3 { background: #3b82f6; }
.prog-bar.z2 { background: #10b981; }
.prog-bar.z1 { background: #94a3b8; }
.zona-pct { width: 40px; text-align: right; font-weight: 700; color: #1e293b; }

.resumen-clase-banner {
  background: #f1f5f9;
  border-radius: 10px;
  padding: 1.2rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.lbl-banner { font-size: 0.8rem; color: #64748b; display: block; margin-bottom: 0.2rem; }
.resumen-clase-banner h3 { margin: 0; font-size: 1.6rem; color: #e94560; }
.tag-cardio { font-weight: 700; color: #2563eb; font-size: 0.95rem; }

.tabla-wrapper {
  overflow-x: auto;
}

.tabla-clase {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tabla-clase th, .tabla-clase td {
  padding: 0.75rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.tabla-clase th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
}

.pill-zona {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.barra-esfuerzo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.barra-esfuerzo .fill {
  height: 8px;
  background: #e94560;
  border-radius: 4px;
}

.barra-esfuerzo .val {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}
</style>
