<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="inicio">

    <!-- Hero -->
    <section class="hero">
      <h1>Bienvenido a <span class="marca">Gestor de Datos Sensor</span></h1>
      <p class="subtitulo">Graba sesiones biométricas, gestiona sensores y revisa tus datos en un solo lugar.</p>
      <div class="hero-acciones">
        <RouterLink to="/grabacion" class="btn-primary">Iniciar grabación</RouterLink>
        <RouterLink to="/sesiones"  class="btn-outline">Ver sesiones</RouterLink>
      </div>
    </section>

    <!-- Tarjetas de acceso rápido -->
    <section class="categorias">

      <RouterLink to="/grabacion" class="cat-card">
        <div class="icono">⏺</div>
        <h3>Grabación</h3>
        <p>Inicia y controla sesiones de captura de datos en tiempo real.</p>
      </RouterLink>

      <RouterLink to="/sesiones" class="cat-card">
        <div class="icono">📋</div>
        <h3>Sesiones</h3>
        <p>Revisa, filtra y exporta las sesiones grabadas.</p>
      </RouterLink>

      <RouterLink to="/vinculacion" class="cat-card">
        <div class="icono">🔗</div>
        <h3>Vinculación</h3>
        <p>Asocia sensores a sesiones para registrar datos biométricos.</p>
      </RouterLink>

    </section>

  </main>
</template>

<style scoped>
.inicio {
  background: #f4f6fb;
  min-height: 80vh;
  padding: 0;
}

/* Hero */
.hero {
  background: #1a1a2e;
  color: #fff;
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}
.hero h1 {
  font-size: 2.6rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}
.marca { color: #e94560; }
.subtitulo {
  color: #8b949e;
  font-size: 1.1rem;
  max-width: 540px;
  line-height: 1.6;
  margin: 0;
}
.hero-acciones {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.btn-primary {
  background: #e94560;
  color: #fff;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
}
.btn-primary:hover { background: #c73652; }
.btn-outline {
  background: transparent;
  color: #fff;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.4);
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s, border-color 0.2s;
}
.btn-outline:hover {
  background: rgba(255,255,255,0.08);
  border-color: #fff;
}

/* Tarjetas */
.categorias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
  padding: 3rem 2rem;
  max-width: 900px;
  margin: 0 auto;
}
.cat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 2rem 1.5rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.cat-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.09);
  transform: translateY(-4px);
  border-color: #e94560;
}
.icono {
  font-size: 2.2rem;
  margin-bottom: 0.4rem;
}
.cat-card h3 {
  color: #1a1a2e;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}
.cat-card p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}
</style>
