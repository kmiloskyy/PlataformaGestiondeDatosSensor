<script setup>
import { computed, ref, watch } from 'vue'
import PanelSesion from '../src/components/PanelSesion.vue'
import UltimoPaquete from '../src/components/UltimoPaquete.vue'
import GraficoSesion from '../src/components/GraficoSesion.vue'
import { sesionesActivas, puente, puentes, sondear, store } from '../src/store.js'

const seleccion = ref(null)
const sesion = computed(() => sesionesActivas.value.find((s) => s.id_sesion === seleccion.value) ?? sesionesActivas.value[0] ?? null)
const tiempos = computed(() => new Map(store.lecturasActivas.map((lectura) => [lectura.id_sesion, lectura])))
const cantidad = computed(() => !store.errores.estado && sesionesActivas.value.length)
watch(() => Boolean(cantidad.value), (activo, _, limpiar) => {
  if (activo) limpiar(sondear('lecturasActivas'))
}, { immediate: true })

function conexion(s) {
  return s.direccion_mac ? puentes.value.find((p) => p.direccion_mac === s.direccion_mac) : puente.value
}

function estado(s) {
  if (store.errores.estado) return 'Sin confirmación de la API'
  if (!conexion(s)?.disponible) return 'Sensor sin conexión'
  if (store.errores.lecturasActivas) return 'No se pudo consultar la última lectura'
  return tiempos.value.has(s.id_sesion) ? 'Recibiendo datos' : 'Esperando lecturas'
}
</script>

<template>
  <div class="medicion-view">
    <header class="pagina-encabezado">
      <h1>Grabación en vivo</h1>
      <p>Inicia los Polar juntos y consulta las señales de cada persona o ubicación por separado.</p>
    </header>
    <div class="medicion-grid">
      <PanelSesion />
      <template v-if="sesion">
        <section class="card full">
          <h2>Sensores en esta grabación</h2>
          <div class="tabla-scroll">
            <table>
              <thead><tr><th>Sujeto</th><th>Ubicación</th><th>Polar</th><th>Estado</th><th>FC reciente</th><th>Señales</th></tr></thead>
              <tbody>
                <tr v-for="s in sesionesActivas" :key="s.id_sesion">
                  <th scope="row">{{ s.sujeto }}</th>
                  <td>{{ s.ubicacion || '—' }}</td>
                  <td>{{ conexion(s)?.dispositivo || 'Polar' }}<template v-if="s.direccion_mac"><br />{{ s.direccion_mac }}</template></td>
                  <td>{{ estado(s) }}</td>
                  <td>{{ !store.errores.lecturasActivas && !store.errores.estado && tiempos.get(s.id_sesion)?.frecuencia_cardiaca
                    ? tiempos.get(s.id_sesion).frecuencia_cardiaca + ' lpm' : '—' }}</td>
                  <td>
                    <button type="button" class="secundario" :aria-pressed="s.id_sesion === sesion.id_sesion"
                      :aria-label="'Ver señales de ' + s.sujeto + ' · ' + (s.ubicacion || s.direccion_mac || s.id_sesion)"
                      @click="seleccion = s.id_sesion">
                      Ver señales
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <UltimoPaquete :key="sesion.id_sesion" :sesion="sesion" />
        <GraficoSesion :sesion="sesion" :errores-sensor="conexion(sesion)?.errores" en-vivo />
      </template>
    </div>
  </div>
</template>
