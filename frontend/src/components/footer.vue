<script setup>
import { RouterLink } from 'vue-router'

const anio = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">

      <div class="footer-brand">
        <span class="brand-name">Gestor</span>
        <p>Plataforma de gestión y grabación de datos de sensores biométricos.</p>
      </div>

      <nav class="footer-nav">
        <RouterLink to="/grabacion">Grabar</RouterLink>
        <RouterLink to="/sesiones">Sesiones</RouterLink>
        <RouterLink to="/vinculacion">Vinculación</RouterLink>
      </nav>

    </div>

    <div class="footer-bottom">
      <span>© {{ anio }} Gestor — Plataforma de Datos Biometricos</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #000000;
  color: #c9d1d9;
  margin-top: auto;
}

.footer-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

/* Marca */
.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
}
.brand-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e94560;
  letter-spacing: 1px;
}
.footer-brand p {
  font-size: 0.85rem;
  color: #8b949e;
  line-height: 1.5;
}

/* Navegación */
.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.footer-nav a {
  color: #8b949e;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.footer-nav a:hover {
  color: #e94560;
}

/* Línea inferior */
.footer-bottom {
  border-top: 1px solid #2d2d44;
  text-align: center;
  padding: 1rem 1.5rem;
  font-size: 0.8rem;
  color: #6e7681;
}
</style>

