<script setup>
import { RouterLink } from 'vue-router'
import { sensorState } from '../services/sensorBridge.js'
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="logo">Polar<span class="punto">Sense</span></h2>
      <span class="tag-plataforma">Plataforma de Monitoreo</span>
    </div>
    
    <nav class="sidebar-nav">
      <RouterLink to="/" class="nav-link">
        <span class="icono"></span> Inicio
      </RouterLink>
      <RouterLink to="/grabacion" class="nav-link">
        <span class="icono"></span> Grabación en Vivo
        <span v-if="sensorState.grabando" class="rec-dot"></span>
      </RouterLink>
      <RouterLink to="/sesiones" class="nav-link">
        <span class="icono"></span> Sesiones y Reportes
      </RouterLink>
      <RouterLink to="/dispositivos" class="nav-link">
        <span class="icono"></span> Sensores
      </RouterLink>
      <RouterLink to="/puente" class="nav-link">
        <span class="icono"></span> Puente Polar
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="estado-sistema">
        <div class="indicador-puente">
          <span class="punto-verde"></span>
          <span>12 Sensores Listos</span>
        </div>
      </div>
      <p class="version">v1.2.0 · Polar BLE</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background: #1a1a2e;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2a2a4a;
  z-index: 100;
}

.sidebar-header {
  padding: 1.8rem 1.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  letter-spacing: -0.5px;
}
.logo .punto {
  color: #e94560;
}

.tag-plataforma {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-nav {
  padding: 1.5rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link .icono {
  font-size: 1.1rem;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  transform: translateX(3px);
}

.nav-link.router-link-exact-active {
  background: #e94560;
  color: #fff;
}

.rec-dot {
  width: 8px;
  height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
  position: absolute;
  right: 1rem;
  animation: pulso 1s infinite;
}

@keyframes pulso {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.sidebar-footer {
  padding: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.indicador-puente {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: #a7f3d0;
  font-weight: 600;
}

.punto-verde {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
}

.version {
  color: #64748b;
  font-size: 0.72rem;
  margin: 0;
}
</style>
