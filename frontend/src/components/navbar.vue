<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <RouterLink to="/">Gestor</RouterLink>
    </div>
    <ul class="navbar-links">
      <li>
        <RouterLink to="/grabacion">Grabar</RouterLink>
      </li>
      <li>
        <RouterLink to="/sesiones">Sesiones</RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 2rem;
  background: #1a1a2e;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand a {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e94560;
  text-decoration: none;
  letter-spacing: 1px;
}

.navbar-links {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar-links a {
  color: #c9d1d9;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.4rem 1.2rem;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.navbar-links a:hover,
.navbar-links a.router-link-active {
  background: #e94560;
  color: #fff;
}
</style>
