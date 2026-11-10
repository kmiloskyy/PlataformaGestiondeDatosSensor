<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const grabando = ref(false)
const tiempo = ref('00:00')

function toggleGrabar() {
  grabando.value = !grabando.value
}
</script>

<template>
  <main class="grabacion">

    <!-- Encabezado -->
    <div class="page-header">
      <h1>Grabaciones de Sesión</h1>
      <p class="subtitulo">Configura los datos de la sesión y controla la grabación.</p>
    </div>

    <div class="layout">

      <!-- Panel izquierdo: control -->
      <div class="panel-control">
        <section class="card card-grabar">
          <div class="estado-badge" :class="grabando ? 'activo' : 'inactivo'">
            {{ grabando ? '🔴 Grabando...' : '⏸ En espera' }}
          </div>
          <div class="cronometro">{{ tiempo }}</div>
          <button
            class="btn-grabar"
            :class="{ 'btn-stop': grabando }"
            @click="toggleGrabar"
          >
            {{ grabando ? '⏹ Detener grabación' : '⏺ Iniciar grabación' }}
          </button>
          <RouterLink to="/sesiones" class="btn-sesiones">Mis sesiones →</RouterLink>
        </section>
      </div>

      <!-- Panel derecho: formulario -->
      <div class="panel-form">
        <section class="card">
          <h2 class="card-title">Datos de la sesión</h2>
          <p class="card-sub">Se guardan junto a la grabación para encontrarla después.</p>

          <label>Título
            <input type="text" placeholder="Ej: Sesión 1 - Laboratorio" />
          </label>
          <label>Sujeto de estudio
            <input type="text" placeholder="Nombre del sujeto" />
          </label>
          <label>Grupo
            <input type="text" placeholder="Ej: Grupo A" />
          </label>
          <label>Sensor
            <select>
              <option value="">— Seleccionar sensor —</option>
            </select>
          </label>
        </section>
      </div>

    </div>

    <!-- Últimas grabaciones -->
    <section class="ultimas">
      <div class="ultimas-header">
        <div>
          <h2>Últimas grabaciones</h2>
          <p class="card-sub">Las grabaciones más recientes de la sesión.</p>
        </div>
        <RouterLink to="/sesiones" class="btn-ver-todas">Ver todas →</RouterLink>
      </div>

      <div class="empty-grabaciones">
        <p>Aún no hay grabaciones. Pulsa «Iniciar grabación» y aparecerán aquí.</p>
      </div>
    </section>

  </main>
</template>

<style scoped>
.grabacion {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

/* Encabezado */
.page-header {
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 1.9rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 0.3rem;
}
.subtitulo {
  color: #666;
  font-size: 0.95rem;
}

/* Layout dos columnas */
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media (max-width: 680px) {
  .layout { grid-template-columns: 1fr; }
}

/* Cards */
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
}
.card-sub {
  font-size: 0.85rem;
  color: #888;
  margin-top: -0.5rem;
}

/* Formulario */
label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #444;
}
input[type="text"],
select {
  padding: 0.55rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fafafa;
  color: #111;
  outline: none;
}
input[type="text"]:focus,
select:focus {
  border-color: #1a1a2e;
}

/* Card grabar */
.card-grabar {
  align-items: center;
  text-align: center;
  gap: 1.2rem;
  height: 100%;
  justify-content: center;
}
.estado-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.3rem 1rem;
  border-radius: 20px;
}
.estado-badge.activo  { background: #fee2e2; color: #b91c1c; }
.estado-badge.inactivo { background: #f3f4f6; color: #6b7280; }

.cronometro {
  font-size: 3.8rem;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: 4px;
  font-variant-numeric: tabular-nums;
}

.btn-grabar {
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}
.btn-grabar:hover { background: #e94560; }
.btn-stop         { background: #e94560; }
.btn-stop:hover   { background: #c73652; }

.btn-sesiones {
  color: #1a1a2e;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  transition: background 0.2s;
  width: 100%;
  text-align: center;
}
.btn-sesiones:hover { background: #f3f4f6; }

/* Últimas grabaciones */
.ultimas {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.5rem;
}
.ultimas-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.ultimas-header h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.2rem;
}
.btn-ver-todas {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a2e;
  text-decoration: none;
  border: 1px solid #d1d5db;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-ver-todas:hover { background: #f3f4f6; }

.empty-grabaciones {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 0.5rem;
  color: #aaa;
  font-size: 0.9rem;
}
.empty-grabaciones span { font-size: 1.5rem; }
</style>
