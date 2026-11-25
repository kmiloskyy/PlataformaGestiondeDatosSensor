<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { asignaciones, cambiarAsignacion, estadoPuente, puenteDisponible, puentes, sesionesActivas, sondear, store } from '../src/store.js'

let detenerSensores
let detenerSujetos
onMounted(() => {
  detenerSensores = sondear('sensores', 2000)
  detenerSujetos = sondear('sujetos', 10000)
})
onBeforeUnmount(() => { detenerSensores?.(); detenerSujetos?.() })
const fecha = (valor) => valor ? new Date(valor).toLocaleString() : '—'
</script>

<template>
  <div class="medicion-view">
    <header class="pagina-encabezado">
      <h1>Sensores y vinculaciones</h1>
      <p>Asigna un sujeto y la ubicación de cada Polar antes de grabar.</p>
    </header>
    <div class="medicion-grid">
      <section class="card full">
        <h2>Asignar sensores</h2>
        <p class="estado" :class="{ ok: puenteDisponible, err: store.errores.estado }">{{ estadoPuente }}</p>
        <p v-if="store.errores.sujetos" class="estado err" role="alert">No se pudieron consultar los sujetos.</p>
        <p v-else-if="store.sujetos?.length === 0" class="estado">No hay sujetos de estudio registrados.</p>
        <p v-if="!puentes.length" class="estado">Enciende y empareja los Polar en Windows y abre Puente Polar.</p>
        <p v-else-if="store.estado?.midiendo" class="estado">Detén la grabación para cambiar las asignaciones.</p>
        <div v-if="puentes.length" class="tabla-scroll">
          <table class="asignaciones">
            <thead><tr><th>Polar</th><th>Estado</th><th>Sujeto</th><th>Ubicación en el cuerpo</th></tr></thead>
            <tbody>
              <tr v-for="sensor in puentes" :key="sensor.direccion_mac">
                <th scope="row">{{ sensor.dispositivo || 'Polar' }}<br /><small>{{ sensor.direccion_mac }}</small></th>
                <td :class="{ ok: sensor.disponible && !store.errores.estado }">
                  {{ store.errores.estado ? 'Sin confirmar' : sensor.disponible ? 'Disponible' : 'Sin conexión' }}
                </td>
                <td>
                  <select
                    :aria-label="'Sujeto de ' + sensor.direccion_mac"
                    :value="asignaciones[sensor.direccion_mac]?.id_sujeto ?? ''"
                    :disabled="Boolean(store.estado?.midiendo || !store.sujetos?.length || store.errores.sujetos)"
                    @change="cambiarAsignacion(sensor.direccion_mac, { id_sujeto: Number($event.target.value) || null })"
                  >
                    <option value="">Sin asignar</option>
                    <option v-for="s in store.sujetos" :key="s.id_sujeto" :value="s.id_sujeto">{{ s.Nombre }}</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    list="ubicaciones-polar"
                    maxlength="80"
                    placeholder="Ej. Brazo izquierdo"
                    :aria-label="'Ubicación de ' + sensor.direccion_mac"
                    :value="asignaciones[sensor.direccion_mac]?.ubicacion ?? ''"
                    :disabled="store.estado?.midiendo"
                    @input="cambiarAsignacion(sensor.direccion_mac, { ubicacion: $event.target.value })"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <datalist id="ubicaciones-polar">
            <option value="Brazo izquierdo" /><option value="Brazo derecho" />
            <option value="Antebrazo izquierdo" /><option value="Antebrazo derecho" />
            <option value="Pierna izquierda" /><option value="Pierna derecha" />
          </datalist>
        </div>
        <div class="controles">
          <RouterLink to="/grabacion">Ir a Grabación en vivo</RouterLink>
          <RouterLink to="/puente">Ver diagnóstico del puente</RouterLink>
        </div>
      </section>

      <section class="card full">
        <h2>Últimas vinculaciones registradas</h2>
        <p v-if="store.errores.sensores" class="estado err" role="alert">No se pudieron consultar las vinculaciones.</p>
        <p v-else-if="!store.sensores" class="estado">Cargando sensores…</p>
        <p v-else-if="!store.sensores.length" class="estado">Aún no se han guardado datos de ningún sensor.</p>
        <div v-else class="tabla-scroll">
          <table>
            <thead><tr><th>Dispositivo</th><th>MAC</th><th>Sujeto</th><th>Ubicación</th><th>Sesión</th><th>Última vinculación</th></tr></thead>
            <tbody>
              <tr v-for="sensor in store.sensores" :key="sensor.id_sensor">
                <th scope="row">{{ sensor.nombre }}</th>
                <td>{{ sensor.direccion_mac || '—' }}</td>
                <td>{{ sensor.sujeto || '—' }}</td>
                <td>{{ sensor.ubicacion || '—' }}</td>
                <td>{{ sensor.id_sesion == null ? '—' : '#' + sensor.id_sesion }}</td>
                <td>
                  {{ fecha(sensor.fecha_vinculacion) }}
                  <span v-if="!store.errores.estado && sesionesActivas.some((s) => s.id_sesion === sensor.id_sesion)" class="estado ok"> · Activa</span>
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

<style scoped>
.asignaciones th, .asignaciones td { vertical-align: middle; }
.asignaciones th small { font-weight: 400; color: #475569; }
.asignaciones select, .asignaciones input { width: 100%; min-width: 10rem; }
</style>
