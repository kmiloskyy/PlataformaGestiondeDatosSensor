<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import ReportModal from '../src/components/ReportModal.vue'
import { exportarCSV } from '../src/services/exportService.js'

// Sesiones históricas registradas en el sistema (simuladas y persistentes)
const listaSesiones = ref([
  {
    id: 1,
    nombre: 'Clase Educación Física - HIIT y Resistencia',
    fecha: '15/11/2026 10:30',
    duracionMin: 45,
    tipo: 'Clase Multidispositivo',
    grupo: '4to Medio A',
    sujetos: '12 Alumnos simultáneos',
    sensoresCount: 12,
    muestras: 135000,
    fcMedia: 138,
    senales: ['FC', 'Acelerómetro', 'PPG']
  },
  {
    id: 2,
    nombre: 'Prueba de Campo - Test de Resistencia Progresiva',
    fecha: '14/11/2026 16:15',
    duracionMin: 25,
    tipo: 'Prueba de Campo Terreno',
    grupo: 'Selección Atletismo',
    sujetos: '8 Atletas',
    sensoresCount: 8,
    muestras: 75000,
    fcMedia: 152,
    senales: ['FC', 'Acelerómetro', 'RR']
  },
  {
    id: 3,
    nombre: 'Monitoreo Domiciliario - Estudio Nocturno de Sueño',
    fecha: '12/11/2026 23:00',
    duracionMin: 420,
    tipo: 'Monitoreo Remoto Smartphone',
    grupo: 'Paciente 04 - Domicilio',
    sujetos: 'Lucas Morales (Individual)',
    sensoresCount: 1,
    muestras: 1260000,
    fcMedia: 58,
    senales: ['FC', 'Acelerómetro', 'PPG', 'RR']
  },
  {
    id: 4,
    nombre: 'Evaluación Biomecánica - Piques y Salto Vertical',
    fecha: '10/11/2026 09:00',
    duracionMin: 15,
    tipo: 'Laboratorio Biomecánico',
    grupo: 'Grupo Control B',
    sujetos: '4 Alumnos',
    sensoresCount: 4,
    muestras: 45000,
    fcMedia: 144,
    senales: ['FC', 'Acelerómetro', 'Giroscopio']
  }
])

const terminoBusqueda = ref('')
const sesionSeleccionadaParaReporte = ref(null)
const mostrarModalReporte = ref(false)

const sesionesFiltradas = computed(() => {
  const query = terminoBusqueda.value.toLowerCase().trim()
  if (!query) return listaSesiones.value
  return listaSesiones.value.filter(s =>
    s.nombre.toLowerCase().includes(query) ||
    s.sujetos.toLowerCase().includes(query) ||
    s.grupo.toLowerCase().includes(query)
  )
})

const totalMinutos = computed(() => {
  return listaSesiones.value.reduce((acc, s) => acc + s.duracionMin, 0)
})

const totalMuestras = computed(() => {
  return listaSesiones.value.reduce((acc, s) => acc + s.muestras, 0)
})

function abrirReporte(sesion) {
  sesionSeleccionadaParaReporte.value = sesion
  mostrarModalReporte.value = true
}

function descargarCSVDirecto(sesion) {
  exportarCSV(sesion.nombre, null)
}

function exportarTodo() {
  exportarCSV('Todas_las_sesiones_consolidadas', null)
}
</script>

<template>
  <main class="sesiones-view">

    <!-- Encabezado -->
    <div class="page-header">
      <div>
        <h1>Mis Sesiones y Análisis de Reportes</h1>
        <p class="subtitulo">
          Consulta sesiones grabadas, filtra tramos específicos y genera informes en CSV y PDF.
        </p>
      </div>
      <div class="header-acciones">
        <RouterLink to="/grabacion" class="btn-primary">➕ Nueva Grabación</RouterLink>
        <button class="btn-export" @click="exportarTodo">⬇ Exportar Todo en CSV ({{ listaSesiones.length }})</button>
      </div>
    </div>

    <!-- Tarjetas de estadísticas consolidadas -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-num">{{ listaSesiones.length }}</span>
        <span class="stat-label">Sesiones Registradas</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ totalMinutos }} min</span>
        <span class="stat-label">Tiempo Total Grabado</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ (totalMuestras / 1000).toFixed(0) }}k</span>
        <span class="stat-label">Muestras Fisiológicas</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">12</span>
        <span class="stat-label">Sensores Polar Usados</span>
      </div>
    </div>

    <!-- Barra de búsqueda reactiva -->
    <div class="buscador-row">
      <div class="buscador-wrapper">
        <span class="icono-lupa">🔍</span>
        <input
          class="buscador"
          type="text"
          placeholder="Buscar sesión por título, alumno, clase o tipo..."
          v-model="terminoBusqueda"
        />
        <button v-if="terminoBusqueda" class="btn-limpiar" @click="terminoBusqueda = ''">✕</button>
      </div>
    </div>

    <!-- Lista de Sesiones -->
    <div v-if="sesionesFiltradas.length > 0" class="sesiones-list">
      <article v-for="s in sesionesFiltradas" :key="s.id" class="sesion-card">
        <div class="sesion-main-info">
          <div class="sesion-tipo-tag">{{ s.tipo }}</div>
          <h3 class="sesion-titulo">{{ s.nombre }}</h3>
          <div class="sesion-meta">
            <span>{{ s.fecha }}</span>
            <span>{{ s.duracionMin }} minutos</span>
            <span>{{ s.sujetos }}</span>
            <span>{{ s.sensoresCount }} Sensores</span>
            <span> FC Prom: <strong>{{ s.fcMedia }} BPM</strong></span>
          </div>
          <div class="senales-tags">
            <span v-for="sen in s.senales" :key="sen" class="tag-senal">{{ sen }}</span>
          </div>
        </div>

        <div class="sesion-acciones">
          <button class="btn-ver-reporte" @click="abrirReporte(s)">
             Ver Informe & Filtros
          </button>
          <button class="btn-csv-single" @click="descargarCSVDirecto(s)">
            ⬇ CSV
          </button>
        </div>
      </article>
    </div>

    <!-- Estado vacío si no coincide la búsqueda -->
    <div v-else class="empty-state">
      <h2>No se encontraron sesiones</h2>
      <p>No hay grabaciones que coincidan con "{{ terminoBusqueda }}".</p>
      <button class="btn-primary" @click="terminoBusqueda = ''">Mostrar todas las sesiones</button>
    </div>

    <!-- Modal de Reporte Completo (RF-05, RF-07, RF-08, RF-11) -->
    <ReportModal
      v-if="sesionSeleccionadaParaReporte"
      :sesion="sesionSeleccionadaParaReporte"
      :mostrar="mostrarModalReporte"
      @cerrar="mostrarModalReporte = false"
    />

  </main>
</template>

<style scoped>
.sesiones-view {
  max-width: 1040px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.3rem;
}

.subtitulo {
  color: #64748b;
  font-size: 0.92rem;
  margin: 0;
}

.header-acciones {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: #1a1a2e;
  color: #fff;
  padding: 0.65rem 1.3rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.88rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}
.btn-primary:hover { background: #e94560; }

.btn-export {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-export:hover {
  background: #d1fae5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.8rem;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.stat-num {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.buscador-row {
  margin-bottom: 1.5rem;
}

.buscador-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 480px;
}

.icono-lupa {
  position: absolute;
  left: 0.9rem;
  font-size: 0.9rem;
  pointer-events: none;
}

.buscador {
  width: 100%;
  padding: 0.65rem 2rem 0.65rem 2.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #ffffff;
  outline: none;
  transition: border-color 0.2s;
}

.buscador:focus {
  border-color: #1a1a2e;
}

.btn-limpiar {
  position: absolute;
  right: 0.8rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
}

.sesiones-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sesion-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.2rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  transition: all 0.2s ease;
}

.sesion-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.sesion-tipo-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.3rem;
}

.sesion-titulo {
  margin: 0 0 0.4rem;
  font-size: 1.15rem;
  color: #0f172a;
}

.sesion-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 0.6rem;
}

.senales-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tag-senal {
  font-size: 0.7rem;
  background: #f1f5f9;
  color: #475569;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.sesion-acciones {
  display: flex;
  gap: 0.6rem;
}

.btn-ver-reporte {
  background: #1a1a2e;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-ver-reporte:hover { background: #e94560; }

.btn-csv-single {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-csv-single:hover { background: #e2e8f0; }

.empty-state {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #64748b;
}
.empty-state h2 { color: #0f172a; margin-bottom: 0.4rem; }
.empty-state p { margin-bottom: 1rem; }
</style>
