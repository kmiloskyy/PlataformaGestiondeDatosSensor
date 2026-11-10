<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="logo">Gestor<span class="punto">.</span></h2>
    </div>
    
    <nav class="sidebar-nav">
      <!-- Vue Router le agregará automáticamente la clase "router-link-active" a la ruta en la que estés -->
      <RouterLink to="/" class="nav-link">Inicio</RouterLink>
      <RouterLink to="/grabacion" class="nav-link">Grabación</RouterLink>
      <RouterLink to="/sesiones" class="nav-link">Mis Sesiones</RouterLink>
    </nav>

    <div class="sidebar-footer">
      <p class="version">v1.0.0</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background: #1a1a2e; /* Mismo azul oscuro del inicio */
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2a2a4a;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
}
.logo .punto {
  color: #e94560; /* Toque rojo deportivo */
}

.sidebar-nav {
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1; /* Empuja el footer hacia abajo */
}

.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  padding: 0.85rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  padding-left: 1.5rem; /* Pequeño efecto de movimiento al pasar el mouse */
}

/* Vue Router aplica esta clase automáticamente al link de la página actual */
.nav-link.router-link-exact-active {
  background: #e94560;
  color: #fff;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.version {
  color: #64748b;
  font-size: 0.8rem;
  margin: 0;
}
</style>