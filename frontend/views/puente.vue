<script setup>
import { RouterLink } from 'vue-router'
import { estadoPuente, puente, puenteDisponible, puentes, sesionesActivas, store } from '../src/store.js'
import { NOMBRE } from '../src/catalogo.js'

const conSesion = (mac) => sesionesActivas.value.some((s) => s.direccion_mac === mac)
</script>

<template>
  <div class="medicion-view">
    <header class="pagina-encabezado">
      <h1>Puente Polar</h1>
      <p>Consulta la conexión Bluetooth y las señales activas de cada dispositivo.</p>
    </header>
    <div class="medicion-grid">
      <section class="card">
        <h2>Estado del puente</h2>
        <p class="estado" :class="{ ok: puenteDisponible, err: store.errores.estado }">{{ estadoPuente }}</p>
        <p v-if="!puentes.length && puente?.disponible" class="estado warn">Actualiza el ejecutable de Puente Polar para asignar sensores por MAC.</p>
        <div v-for="sensor in puentes" :key="sensor.direccion_mac" class="estado-sensor">
          <h3>{{ sensor.dispositivo || 'Polar' }} · {{ sensor.direccion_mac }}</h3>
          <p v-if="store.errores.estado" class="estado warn">Conexión sin confirmar</p>
          <p v-else-if="!sensor.disponible" class="estado warn">Sensor sin conexión</p>
          <template v-else>
            <p v-if="conSesion(sensor.direccion_mac)" class="estado">
              {{ sensor.activos.length ? 'Señales activas · ' + sensor.activos.map((k) => NOMBRE[k] ?? k).join(', ') : 'Esperando activación de señales' }}
            </p>
            <p v-else class="estado ok">Disponible para grabar</p>
            <p v-for="(mensaje, clave) in sensor.errores" :key="clave" class="estado err">{{ NOMBRE[clave] ?? clave }} · {{ mensaje }}</p>
          </template>
        </div>
      </section>
      <section class="card">
        <h2>Conectar los sensores</h2>
        <ol class="pasos-puente">
          <li>Enciende y empareja todos los Polar por Bluetooth en Windows.</li>
          <li>Ejecuta una instancia de la versión multisensor de Puente Polar.</li>
          <li>En <RouterLink to="/dispositivos">Sensores</RouterLink>, asigna a cada Polar un sujeto y su ubicación.</li>
        </ol>
        <RouterLink to="/grabacion">Ir a Grabación en vivo</RouterLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pasos-puente { padding-left: 1.3rem; margin-bottom: 0.9rem; }
.pasos-puente li + li { margin-top: 0.45rem; }
.estado-sensor { border-top: 1px solid #e2e8f0; margin-top: 0.75rem; }
</style>
