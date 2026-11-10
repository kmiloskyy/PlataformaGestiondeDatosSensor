<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="sesiones">

    <!-- Encabezado -->
    <div class="page-header">
      <div>
        <h1>Mis sesiones grabadas</h1>
        <p class="subtitulo">Aqui estaran las sesiones que has realizado.</p>
      </div>
      <div class="header-acciones">
        <RouterLink to="/grabacion" class="btn-primary">Nueva grabación</RouterLink>
        <button class="btn-export" disabled>⬇ Exportar todo (0)</button>
      </div>
    </div>

    <!-- Tarjetas de estadísticas -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-num">0</span>
        <span class="stat-label">Sesiones guardadas</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">0</span>
        <span class="stat-label">Minutos grabados</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">0</span>
        <span class="stat-label">Muestras registradas</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">0</span>
        <span class="stat-label">Sensores usados</span>
      </div>
    </div>

    <!-- Buscador -->
    <div class="buscador-row">
      <input class="buscador" type="text" placeholder="Buscar por sujeto o sensor" disabled />
    </div>

    <!-- Estado vacío -->
    <div class="empty-state">
      <h2>Todavía no hay grabaciones</h2>
      <p>Cuando grabes una sesión con los sensores aparecerá aquí con sus datos.</p>
      <RouterLink to="/grabacion" class="btn-primary">Ir a grabar</RouterLink>
    </div>

  </main>
</template>

<style scoped>
.sesiones {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

/* Encabezado */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
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
.header-acciones {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.btn-primary {
  background: #1a1a2e;
  color: #fff;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.btn-primary:hover { background: #e94560; }
.btn-export {
  background: #e0f2f1;
  color: #00695c;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.stat-num {
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
}
.stat-label {
  font-size: 0.85rem;
  color: #888;
}

/* Buscador */
.buscador-row {
  margin-bottom: 1.5rem;
}
.buscador {
  width: 100%;
  max-width: 380px;
  padding: 0.6rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  color: #aaa;
  cursor: not-allowed;
}

/* Estado vacío */
.empty-state {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 3.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.empty-state h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111;
}
.empty-state p {
  color: #666;
  font-size: 0.95rem;
  max-width: 380px;
  line-height: 1.6;
}
</style>
