<script setup>
import { RouterLink } from 'vue-router'
import { estadoPuente, puente, puenteDisponible, store } from '../src/store.js'
import { NOMBRE } from '../src/catalogo.js'
</script>

<template>
  <div class="medicion-view">
    <header class="pagina-encabezado">
      <h1>Puente Polar</h1>
      <p>Consulta la comunicación entre la plataforma y el programa de Windows que recibe los datos por Bluetooth.</p>
    </header>
    <div class="medicion-grid">
      <section class="card">
        <h2>Estado del puente</h2>
        <p class="estado" :class="{ ok: puenteDisponible, err: store.errores.estado }">{{ estadoPuente }}</p>
        <p v-if="puenteDisponible && puente.dispositivo" class="estado">{{ puente.dispositivo }}</p>
        <p v-if="puenteDisponible && puente.direccion_mac" class="estado">MAC {{ puente.direccion_mac }}</p>
        <p v-if="puenteDisponible && store.estado?.midiendo" class="estado">
          {{ puente.activos.length ? 'Señales activas · ' + puente.activos.map((k) => NOMBRE[k] ?? k).join(', ') : 'Esperando que el sensor active las señales' }}
        </p>
        <p v-for="(mensaje, clave) in puenteDisponible && store.estado?.midiendo ? puente.errores : {}" :key="clave" class="estado err">
          {{ NOMBRE[clave] ?? clave }} · {{ mensaje }}
        </p>
      </section>
      <section class="card">
        <h2>Conectar el sensor</h2>
        <ol class="pasos-puente">
          <li>Enciende el Polar y emparéjalo por Bluetooth en Windows.</li>
          <li>Ejecuta <code>puente\bin\puente-polar.exe</code> en ese equipo.</li>
          <li>Abre <RouterLink to="/grabacion">Grabación en vivo</RouterLink> y elige el sujeto y las señales.</li>
        </ol>
        <RouterLink to="/dispositivos">Ver sensores y vinculaciones</RouterLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pasos-puente { padding-left: 1.3rem; margin-bottom: 0.9rem; }
.pasos-puente li + li { margin-top: 0.45rem; }
</style>
