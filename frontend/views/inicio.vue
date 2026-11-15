<script setup>
import { RouterLink } from 'vue-router'
import { sensorState } from '../src/services/sensorBridge.js'

function activarModo(modo) {
  sensorState.modoVista = modo
}
</script>

<template>
  <main class="inicio">

    <!-- Hero Principal -->
    <section class="hero">
      <div class="hero-badge">Plataforma Multidispositivo Polar Verity Sense</div>
      <h1>Gestión y Monitoreo <span class="marca">Fisiológico en Tiempo Real</span></h1>
      <p class="subtitulo">
        Captura datos brutos sin algoritmos cerrados (FC, Acelerometría 50 Hz, PPG, Intervalos RR). Diseñado para clases grupales con hasta 12+ dispositivos simultáneos y monitoreo remoto.
      </p>

      <div class="hero-acciones">
        <RouterLink to="/grabacion" class="btn-primary" @click="activarModo('clase')">
           Iniciar Modo Clase (12 Sensores)
        </RouterLink>
        <RouterLink to="/grabacion" class="btn-secundario" @click="activarModo('individual')">
           Modo Alumno / Individual
        </RouterLink>
        <RouterLink to="/sesiones" class="btn-outline">
           Ver Reportes y Sesiones
        </RouterLink>
      </div>
    </section>

    <!-- Resumen Rápido de Estado -->
    <section class="barra-estado">
      <div class="estado-item">
        <span class="punto-ok"></span>
        <span>Receptor Bluetooth LE: <strong>Listo (WinRT / Native Bridge)</strong></span>
      </div>
      <div class="estado-item">
        <span>Sensores Sincronizados: <strong>12 / 12</strong></span>
      </div>
      <div class="estado-item">
        <span>Frecuencia Base: <strong>50.1 Hz (Acelerómetro) · 1 Hz (FC)</strong></span>
      </div>
    </section>

    <!-- Tarjetas de Capacidades y Escenarios (Sección 5 Requerimientos) -->
    <section class="categorias">
      <div class="cat-card">
        <h3>Clase de Educación Física</h3>
        <p>Monitoreo simultáneo de 10 a 30 alumnos en una sola pantalla. El profesor visualiza intensidad grupal y genera reporte de clase consolidado.</p>
        <RouterLink to="/grabacion" class="card-link" @click="activarModo('clase')">Ver Modo Clase →</RouterLink>
      </div>
      
      <div class="cat-card">
        <h3>Monitoreo Remoto & Móvil </h3>
        <p>Conexión directa del sensor al smartphone del alumno para seguimiento diario o estudios de sueño en domicilio con sincronización al servidor.</p>
        <RouterLink to="/grabacion" class="card-link" @click="activarModo('movil')">Ver Modo Remoto →</RouterLink>
      </div>
      
      <div class="cat-card">
        <h3>Datos Crudos e Integridad</h3>
        <p>Almacenamiento de FC y acelerómetro triaxial en una sola plataforma. Inspección de paquetes hexadecimales con 0% de corrupción para análisis biomecánico.</p>
        <RouterLink to="/grabacion" class="card-link">Inspeccionar Señales →</RouterLink>
      </div>

      <div class="cat-card">
        <h3>Exportación & Filtros Temporales</h3>
        <p>Selección de tramos específicos de la sesión (timeline scrubber) y exportación directa en formato CSV, reportes PDF y Dashboard JSON.</p>
        <RouterLink to="/sesiones" class="card-link">Explorar Reportes →</RouterLink>
      </div>
    </section>

  </main>
</template>

<style scoped>
.inicio {
  background: #f4f6fb;
  min-height: 100vh;
  padding-bottom: 3rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.hero {
  background: #1a1a2e;
  color: #fff;
  text-align: center;
  padding: 5rem 2rem 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  border-bottom: 4px solid #e94560;
}

.hero-badge {
  background: rgba(233, 69, 96, 0.15);
  color: #ff6b81;
  border: 1px solid rgba(233, 69, 96, 0.4);
  padding: 0.35rem 1rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero h1 { 
  font-size: 2.7rem; 
  font-weight: 800; 
  color: #fff; 
  margin: 0; 
  max-width: 850px;
  line-height: 1.2;
}

.marca { 
  color: #e94560;
}

.subtitulo { 
  color: #cbd5e1; 
  font-size: 1.05rem; 
  max-width: 680px; 
  line-height: 1.6; 
  margin: 0; 
}

.hero-acciones { 
  display: flex; 
  gap: 1rem; 
  margin-top: 1.2rem; 
  flex-wrap: wrap; 
  justify-content: center; 
}

.btn-primary {
  background: #e94560; 
  color: #fff; 
  padding: 0.8rem 1.8rem;
  border-radius: 8px; 
  text-decoration: none; 
  font-weight: 700; 
  font-size: 0.95rem; 
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
  transition: all 0.2s ease;
}
.btn-primary:hover { 
  background: #c73652; 
  transform: translateY(-2px);
}

.btn-secundario {
  background: #3b82f6; 
  color: #fff; 
  padding: 0.8rem 1.8rem;
  border-radius: 8px; 
  text-decoration: none; 
  font-weight: 700; 
  font-size: 0.95rem; 
  transition: all 0.2s ease;
}
.btn-secundario:hover { 
  background: #2563eb; 
  transform: translateY(-2px);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.08); 
  color: #fff; 
  padding: 0.8rem 1.8rem;
  border-radius: 8px; 
  border: 1px solid rgba(255, 255, 255, 0.3); 
  text-decoration: none;
  font-weight: 600; 
  font-size: 0.95rem; 
  transition: all 0.2s ease;
}
.btn-outline:hover { 
  background: #fff; 
  color: #1a1a2e; 
}

.barra-estado {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  max-width: 960px;
  margin: -2rem auto 2.5rem;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  font-size: 0.85rem;
  color: #475569;
}

.estado-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.punto-ok {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 6px #10b981;
}

.categorias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem; 
  padding: 0 2rem; 
  max-width: 1100px; 
  margin: 0 auto;
}

.cat-card {
  background: #fff; 
  border: 1px solid #e2e8f0; 
  border-radius: 12px;
  padding: 2rem 1.5rem; 
  transition: all 0.25s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}
.cat-card:hover { 
  box-shadow: 0 10px 20px rgba(0,0,0,0.08); 
  transform: translateY(-4px); 
  border-color: #e94560;
}

.icono { 
  font-size: 2.4rem; 
  margin-bottom: 0.8rem;
}

.cat-card h3 { 
  color: #1a1a2e; 
  margin: 0 0 0.6rem 0; 
  font-size: 1.15rem; 
  font-weight: 700;
}

.cat-card p { 
  color: #64748b; 
  font-size: 0.88rem; 
  margin: 0 0 1.2rem; 
  line-height: 1.5;
  flex: 1;
}

.card-link {
  color: #e94560;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.88rem;
}
.card-link:hover {
  text-decoration: underline;
}
</style>
