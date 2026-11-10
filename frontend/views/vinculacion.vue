<script setup>
</script>

<template>
  <main class="vinculacion">

    <!-- Encabezado -->
    <div class="page-header">
      <div>
        <h1>Vinculación de Sensores</h1>
        <p class="subtitulo">Asocia sensores a sesiones de grabación para registrar datos.</p>
      </div>
      <button class="btn-primary">+ Nueva vinculación</button>
    </div>

    <!-- Tabla de vinculaciones -->
    <section class="card">
      <div class="tabla-header">
        <h2 class="card-title">Vinculaciones activas</h2>
        <span class="badge-count">0</span>
      </div>

      <div class="empty-state">
        <span class="empty-icon">🔗</span>
        <p>No hay vinculaciones registradas.</p>
      </div>
    </section>

    <!-- Sensores disponibles -->
    <section class="card">
      <h2 class="card-title">Sensores disponibles</h2>
      <p class="card-sub">Dispositivos registrados en el sistema.</p>

      <div class="empty-state">
        <span class="empty-icon">📡</span>
        <p>No hay sensores registrados.</p>
      </div>
    </section>

  </main>
</template>

<style scoped>
.vinculacion {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Encabezado */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-header h1 {
  font-size: 1.9rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 0.3rem;
}
.subtitulo { color: #666; font-size: 0.95rem; }

/* Botón */
.btn-primary {
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.btn-primary:hover { background: #e94560; }

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
.card-title { font-size: 1.05rem; font-weight: 700; color: #1a1a2e; }
.card-sub   { font-size: 0.85rem; color: #888; margin-top: -0.5rem; }

/* Badge count */
.tabla-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.badge-count {
  background: #1a1a2e;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #aaa;
  font-size: 0.9rem;
  text-align: center;
}
.empty-icon { font-size: 2.5rem; }
</style>
