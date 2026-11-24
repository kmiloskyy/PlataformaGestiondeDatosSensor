<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="inicio">

    <!-- Hero -->
    <section class="hero">
      <h1>Plataforma de <span class="marca">Monitoreo Fisiológico</span></h1>
      <p class="subtitulo">
        Conecta múltiples sensores deportivos vía Bluetooth, visualiza métricas en tiempo real y exporta datos en bruto para investigación y deporte.
      </p>
      <div class="hero-acciones">
        <!-- Se corrigieron las rutas de los botones -->
        <RouterLink to="/grabacion" class="btn-primary">▶ Iniciar Grabación</RouterLink>
        <RouterLink to="/sesiones" class="btn-outline">Ver Mis Sesiones</RouterLink>
      </div>
    </section>

    <!-- Tarjetas de categorias / Características -->
    <section class="categorias">
      <div class="cat-card">
        <div class="icono">🫀</div>
        <h3>Frecuencia Cardíaca</h3>
        <p>Monitoreo en tiempo real de pulsaciones (BPM) e intervalos para estimar la intensidad del ejercicio.</p>
      </div>
      
      <div class="cat-card">
        <div class="icono">🏃🏽‍♂️</div>
        <h3>Acelerometría</h3>
        <p>Registro de datos mecánicos y de movimiento para un análisis físico y biomecánico complementario.</p>
      </div>
      
      <div class="cat-card">
        <div class="icono">📊</div>
        <h3>Exportación de Datos</h3>
        <p>Descarga tus sesiones en formato CSV y genera reportes para el análisis sin algoritmos cerrados.</p>
      </div>
    </section>

  </main>
</template>

<style scoped>
.inicio {
  background: #f4f6fb; /* Un fondo un poco más suave y médico/deportivo */
  min-height: 80vh;
  padding: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Sección principal (Hero) */
.hero {
  background: #1a1a2e; /* Azul oscuro muy profesional */
  color: #fff;
  text-align: center;
  padding: 6rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 4px solid #e94560;
}

.hero h1 { 
  font-size: 3rem; 
  font-weight: 800; 
  color: #fff; 
  margin: 0; 
  letter-spacing: -0.5px;
}

.marca { 
  color: #e94560; /* Rojo/Coral deportivo */
}

.subtitulo { 
  color: #cbd5e1; 
  font-size: 1.15rem; 
  max-width: 600px; 
  line-height: 1.6; 
  margin: 0; 
  font-weight: 400;
}

/* Botones */
.hero-acciones { 
  display: flex; 
  gap: 1.2rem; 
  margin-top: 1rem; 
  flex-wrap: wrap; 
  justify-content: center; 
}

.btn-primary {
  background: #e94560; 
  color: #fff; 
  padding: 0.85rem 2.2rem;
  border-radius: 8px; 
  text-decoration: none; 
  font-weight: 700; 
  font-size: 1rem; 
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}
.btn-primary:hover { 
  background: #c73652; 
  transform: translateY(-2px);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.05); 
  color: #fff; 
  padding: 0.85rem 2.2rem;
  border-radius: 8px; 
  border: 1px solid rgba(255, 255, 255, 0.4); 
  text-decoration: none;
  font-weight: 600; 
  font-size: 1rem; 
  transition: all 0.2s ease;
}
.btn-outline:hover { 
  background: #fff; 
  color: #1a1a2e; 
}

/* Tarjetas de características */
.categorias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem; 
  padding: 4rem 2rem; 
  max-width: 1000px; 
  margin: -3rem auto 0 auto; /* Sube un poco sobre el hero */
}

.cat-card {
  background: #fff; 
  border: 1px solid #e5e7eb; 
  border-radius: 12px;
  padding: 2.5rem 1.5rem; 
  text-align: center; 
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cat-card:hover { 
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
  transform: translateY(-5px); 
  border-color: #e94560;
}

.icono { 
  font-size: 3rem; 
  margin-bottom: 1rem;
  background: #f4f6fb;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.cat-card h3 { 
  color: #1a1a2e; 
  margin: 0 0 0.8rem 0; 
  font-size: 1.25rem; 
  font-weight: 700;
}

.cat-card p { 
  color: #64748b; 
  font-size: 0.95rem; 
  margin: 0; 
  line-height: 1.5;
}
</style>