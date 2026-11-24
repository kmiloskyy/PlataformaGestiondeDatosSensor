<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import Navbar from './components/navbar.vue'
import { RouterView } from 'vue-router'
import { sondear } from './store.js'

let detener
onMounted(() => { detener = sondear('estado') })
onBeforeUnmount(() => detener?.())
</script>

<template>
  <div class="app-container">
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
