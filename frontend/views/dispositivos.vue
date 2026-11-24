<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { estadoPuente, puente, puenteDisponible, sondear, store } from '../src/store.js'

const sesionActiva = computed(() => store.errores.estado ? null : store.estado?.id_sesion)
const vinculado = computed(() => store.sensores?.find((sensor) =>
  sensor.id_sesion != null && sensor.id_sesion === sesionActiva.value && !sensor.fecha_desvinculacion))

let detener
onMounted(() => { detener = sondear('sensores', 2000) })
onBeforeUnmount(() => detener?.())

function fecha(valor) {
  return valor ? new Date(valor).toLocaleString() : '—'
}
</script>

<template>
  <div class="medicion-view">
    <header class="pagina-encabezado">
      <h1>Sensores y vinculaciones</h1>
      <p>Consulta el dispositivo que informa el puente y sus vinculaciones con los sujetos de estudio.</p>
    </header>
    <div class="medicion-grid">
      <section class="card full">
        <h2>Sensor informado por el puente</h2>
        <p class="estado" :class="{ ok: puenteDisponible, err: store.errores.estado }">{{ estadoPuente }}</p>
        <p v-if="puenteDisponible && (puente?.dispositivo || vinculado)" class="estado">
          <strong>{{ puente?.dispositivo || vinculado.nombre }}</strong>
          <template v-if="puente?.direccion_mac || vinculado?.direccion_mac"> · MAC {{ puente?.direccion_mac || vinculado.direccion_mac }}</template>
        </p>
        <p v-else-if="puenteDisponible" class="estado">Esperando la identificación del sensor.</p>
        <p v-if="vinculado" class="estado">Vinculado a {{ vinculado.sujeto }} en la sesión #{{ vinculado.id_sesion }}.</p>
        <p v-else-if="sesionActiva && !store.errores.sensores" class="estado">La vinculación se registra al guardar el primer paquete.</p>
        <div class="controles">
          <RouterLink v-if="puenteDisponible" to="/grabacion">{{ sesionActiva ? 'Ver grabación en curso' : 'Vincular a una sesión' }}</RouterLink>
          <RouterLink to="/puente">Ver diagnóstico del puente</RouterLink>
        </div>
      </section>

      <section class="card full">
        <h2>Sensores registrados</h2>
        <p v-if="store.errores.sensores" class="estado err" role="alert">No se pudieron consultar las vinculaciones.</p>
        <p v-else-if="!store.sensores" class="estado">Cargando sensores…</p>
        <p v-else-if="!store.sensores.length" class="estado">Aún no se han guardado datos de ningún sensor.</p>
        <div v-else class="tabla-scroll">
          <table>
            <thead><tr><th>Dispositivo</th><th>MAC</th><th>Último sujeto</th><th>Sesión</th><th>Última vinculación</th></tr></thead>
            <tbody>
              <tr v-for="sensor in store.sensores" :key="sensor.id_sensor">
                <th scope="row">{{ sensor.nombre }}</th>
                <td>{{ sensor.direccion_mac || '—' }}</td>
                <td>{{ sensor.sujeto || '—' }}</td>
                <td>{{ sensor.id_sesion == null ? '—' : '#' + sensor.id_sesion }}</td>
                <td>
                  {{ fecha(sensor.fecha_vinculacion) }}
                  <span v-if="sensor.id_sensor === vinculado?.id_sensor" class="estado ok"> · Activa</span>
                  <template v-else-if="sensor.fecha_desvinculacion"><br />Finalizó el {{ fecha(sensor.fecha_desvinculacion) }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
