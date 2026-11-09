<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { detenerSondeo, iniciarSondeo } from './store.js'
import PanelSesion from './components/PanelSesion.vue'
import UltimoPaquete from './components/UltimoPaquete.vue'
import GraficoSesion from './components/GraficoSesion.vue'
import TablaSesiones from './components/TablaSesiones.vue'

const grafico = ref(null)
onMounted(iniciarSondeo)
onBeforeUnmount(detenerSondeo)
</script>

<template>
  <h1>Polar Verity Sense → Plataforma de gestión de datos</h1>
  <div class="grid">
    <PanelSesion />
    <UltimoPaquete />
    <GraficoSesion ref="grafico" />
    <TablaSesiones @ver="grafico?.ver($event)" />
  </div>
</template>
