<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../api.js'
import { SENSORES } from '../catalogo.js'
import { aplicarEstado, asignaciones, disponibles, puentes, sesionesActivas, sondear, store } from '../store.js'

let guardado
try { guardado = JSON.parse(localStorage.getItem('datosElegidos')) } catch { /* almacenamiento no disponible */ }
const elegidos = ref(Array.isArray(guardado) ? guardado.filter((clave) => SENSORES.some((s) => s.k === clave)) : ['fc', 'acc'])
const nombreSesion = ref('')
const enviando = ref(false)
const error = ref('')
const omitidos = reactive(new Set())
const midiendo = computed(() => Boolean(store.estado?.midiendo))
const sensores = computed(() => puentes.value.map((sensor) => {
  const mac = sensor.direccion_mac
  const asignacion = asignaciones[mac]
  const sujeto = store.sujetos?.find((s) => s.id_sujeto === asignacion?.id_sujeto)
  return {
    direccion_mac: mac, nombre: sensor.dispositivo, disponible: sensor.disponible && !store.errores.estado,
    id_sujeto: sujeto?.id_sujeto, sujeto: sujeto?.Nombre, ubicacion: asignacion?.ubicacion,
  }
}))
const incluidas = computed(() => sensores.value.filter((s) =>
  s.disponible && s.id_sujeto != null && !omitidos.has(s.direccion_mac)))
const puedeEnviar = computed(() => store.estado && !store.errores.estado && !enviando.value &&
  (midiendo.value || (incluidas.value.length > 0 && elegidos.value.length > 0 && !store.errores.sujetos)))

let detenerSondeo
onMounted(() => { detenerSondeo = sondear('sujetos', 10000) })
onBeforeUnmount(() => detenerSondeo?.())

watch(elegidos, (datos) => {
  try { localStorage.setItem('datosElegidos', JSON.stringify(datos)) } catch { /* almacenamiento no disponible */ }
})

function incluir(mac, usar) {
  if (usar) omitidos.delete(mac)
  else omitidos.add(mac)
}

async function alternar() {
  if (!puedeEnviar.value) return
  error.value = ''
  enviando.value = true
  try {
    const estado = midiendo.value
      ? await api.detener()
      : await api.iniciar(
        incluidas.value.map(({ direccion_mac, id_sujeto, ubicacion }) => ({ direccion_mac, id_sujeto, ubicacion })),
        elegidos.value,
        nombreSesion.value.trim(),
      )
    aplicarEstado(estado)
  } catch (e) {
    error.value = e.message
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <form class="card panel-sesion full" @submit.prevent="alternar">
    <h2>Control de grabación</h2>

    <p v-if="midiendo" class="estado ok">{{ sesionesActivas.length }} {{ sesionesActivas.length === 1 ? 'sensor en grabación' : 'sensores en grabación' }}</p>
    <template v-else>
      <fieldset :disabled="enviando">
        <legend>Sensores para esta grabación</legend>
        <div v-if="sensores.length" class="checks sensores-disponibles">
          <label v-for="sensor in sensores" :key="sensor.direccion_mac">
            <input type="checkbox"
              :disabled="!sensor.disponible || sensor.id_sujeto == null || Boolean(store.errores.sujetos)"
              :checked="sensor.disponible && sensor.id_sujeto != null && !omitidos.has(sensor.direccion_mac)"
              @change="incluir(sensor.direccion_mac, $event.target.checked)" />
            <span>
              {{ sensor.nombre || 'Polar' }}
              <small>{{ sensor.direccion_mac }}</small>
              <small v-if="sensor.sujeto">{{ sensor.sujeto }}<template v-if="sensor.ubicacion"> · {{ sensor.ubicacion }}</template></small>
              <small v-if="!sensor.disponible" class="warn">{{ store.errores.estado ? 'Sin confirmar' : 'Sensor sin conexión' }}</small>
              <small v-else-if="!store.sujetos && !store.errores.sujetos">Cargando sujetos…</small>
              <small v-else-if="sensor.id_sujeto == null && !store.errores.sujetos" class="warn">Asigna un sujeto en Sensores.</small>
            </span>
          </label>
        </div>
        <p v-else class="estado">Aún no hay Polar identificados por el puente.</p>
        <RouterLink to="/dispositivos">Asignar sujetos en Sensores</RouterLink>
        <p v-if="store.errores.sujetos" class="estado err" role="alert">No se pudieron consultar los sujetos.</p>
      </fieldset>
      <fieldset :disabled="enviando">
        <label for="nombre-sesion">Nombre de la grabación (opcional)</label>
        <input id="nombre-sesion" v-model="nombreSesion" type="text" maxlength="120" />
      </fieldset>
      <fieldset :disabled="enviando">
        <legend>Señales a registrar en todos los sensores seleccionados</legend>
        <div class="checks">
          <label v-for="s in SENSORES" :key="s.k">
            <input v-model="elegidos" type="checkbox" :value="s.k" />
            <span>{{ s.nombre }}<small>{{ s.desc }}</small></span>
          </label>
        </div>
      </fieldset>
    </template>

    <button type="submit" :class="midiendo ? 'detener' : 'iniciar'" :disabled="!puedeEnviar">
      {{ enviando ? 'Guardando…' : midiendo ? 'Detener grabación' : 'Iniciar grabación' }}
    </button>
    <p v-if="error" class="estado err" role="alert">{{ error }}</p>
    <p v-if="store.errores.estado" class="estado err" role="alert">Sin conexión con la API de grabación.</p>
    <p v-else-if="!store.estado" class="estado">Consultando el estado de grabación…</p>
    <p v-else-if="!disponibles.length" class="estado warn">No hay sensores disponibles. <RouterLink to="/puente">Ver diagnóstico</RouterLink>.</p>
  </form>
</template>

<style scoped>
.panel-sesion fieldset { border: 0; min-width: 0; margin-bottom: 1rem; }
.panel-sesion input[type="text"] { width: min(100%, 28rem); }
.sensores-disponibles label { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem; overflow-wrap: anywhere; }
.sensores-disponibles .warn { color: #92400e; }
</style>
