<script setup>
import { computed } from 'vue'
import PanelSesion from '../src/components/PanelSesion.vue'
import UltimoPaquete from '../src/components/UltimoPaquete.vue'
import GraficoSesion from '../src/components/GraficoSesion.vue'
import { store } from '../src/store.js'

const sesion = computed(() => store.estado?.midiendo ? store.estado : null)
</script>

<template>
  <div class="medicion-view">
    <header class="pagina-encabezado">
      <h1>Grabación en vivo</h1>
      <p>Elige el sujeto y las señales. El sensor queda vinculado a la sesión cuando llega el primer paquete.</p>
    </header>
    <div class="medicion-grid">
      <PanelSesion />
      <UltimoPaquete />
      <GraficoSesion :sesion="sesion" en-vivo />
    </div>
  </div>
</template>
