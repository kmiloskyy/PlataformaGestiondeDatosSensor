<script setup>
import { onBeforeUnmount, watch } from 'vue'
import Navbar from './components/navbar.vue'
import { RouterView, useRoute } from 'vue-router'
import { sondear } from './store.js'
import { esProfesor } from './auth.js'

const route = useRoute()

// El estado de grabación solo lo puede consultar el profesor; se sondea mientras haya un profesor con sesión iniciada.
let detener
watch(esProfesor, (activo) => {
  detener?.()
  detener = activo ? sondear('estado') : undefined
}, { immediate: true })
onBeforeUnmount(() => detener?.())
</script>

<template>
  <RouterView v-if="route.name === 'Login'" />
  <div v-else class="app-container">
    <!-- El Navbar ahora actuará como menú lateral -->
    <Navbar />
    
    <!-- El contenido principal de las vistas va a la derecha -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Estilos globales básicos */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #f4f6fb;
  color: #111;
}

/* Layout de pantalla dividida */
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  /* Deja un margen izquierdo igual al ancho del menú lateral (250px) */
  margin-left: 250px; 
  width: calc(100% - 250px);
}

@media (max-width: 760px) {
  .app-container { display: block; }
  .main-content { margin-left: 0; width: 100%; }
}
</style>
