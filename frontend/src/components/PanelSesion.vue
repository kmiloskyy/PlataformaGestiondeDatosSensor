<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../api.js'
import { NOMBRE, SENSORES } from '../catalogo.js'
import { aplicarEstado, puente, puenteDisponible, sondear, store } from '../store.js'

let guardado
try { guardado = JSON.parse(localStorage.getItem('datosElegidos')) } catch { /* almacenamiento no disponible */ }
const elegidos = ref(Array.isArray(guardado) ? guardado.filter((clave) => Object.hasOwn(NOMBRE, clave)) : ['fc', 'acc'])
const idSujeto = ref(null)
const nombreSesion = ref('')
const enviando = ref(false)
const error = ref('')
const midiendo = computed(() => Boolean(store.estado?.midiendo))
const marcados = computed(() => midiendo.value ? store.estado.datos : elegidos.value)
const puedeEnviar = computed(() => store.estado && !store.errores.estado && !enviando.value &&
  (midiendo.value || (puenteDisponible.value && idSujeto.value != null && elegidos.value.length > 0)))

const duracion = computed(() => {
  const inicio = store.estado?.fecha_inicio
  if (!inicio) return ''
  const segundos = Math.max(0, Math.floor((Date.now() - Date.parse(inicio)) / 1000))
  return [Math.floor(segundos / 60), segundos % 60].map((n) => String(n).padStart(2, '0')).join(':')
})

let detenerSondeo
onMounted(() => { detenerSondeo = sondear('sujetos', 10000) })
onBeforeUnmount(() => detenerSondeo?.())

watch(elegidos, (datos) => {
  try { localStorage.setItem('datosElegidos', JSON.stringify(datos)) } catch { /* almacenamiento no disponible */ }
})
watch(() => store.sujetos, (sujetos) => {
  if (!sujetos?.some((s) => s.id_sujeto === idSujeto.value)) idSujeto.value = sujetos?.[0]?.id_sujeto ?? null
}, { immediate: true })

async function alternar() {
  if (!puedeEnviar.value) return
  error.value = ''
  enviando.value = true
  try {
    const estado = midiendo.value
      ? await api.detener()
      : await api.iniciar(idSujeto.value, elegidos.value, nombreSesion.value.trim())
    aplicarEstado(estado)
  } catch (e) {
    error.value = e.message
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <form class="card panel-sesion" @submit.prevent="alternar">
    <h2>Sesión de grabación</h2>

    <div v-if="midiendo" class="sesion-activa">
      <strong>Sesión #{{ store.estado.id_sesion }} · {{ store.estado.sujeto }}</strong>
      <span v-if="duracion" aria-label="Tiempo transcurrido">{{ duracion }}</span>
    </div>
    <fieldset v-else :disabled="enviando">
      <label for="sujeto">Sujeto de estudio</label>
      <select id="sujeto" v-model="idSujeto" :disabled="!store.sujetos?.length">
        <option :value="null" disabled>Selecciona un sujeto</option>
        <option v-for="s in store.sujetos" :key="s.id_sujeto" :value="s.id_sujeto">{{ s.Nombre }}</option>
      </select>
      <p v-if="store.errores.sujetos" class="estado err" role="alert">No se pudieron cargar los sujetos.</p>
      <p v-else-if="store.sujetos?.length === 0" class="estado">No hay sujetos de estudio registrados.</p>
      <label for="nombre-sesion">Nombre de la sesión (opcional)</label>
      <input id="nombre-sesion" v-model="nombreSesion" type="text" maxlength="120" />
    </fieldset>

    <fieldset :disabled="midiendo || enviando">
      <legend>Señales a registrar</legend>
      <div class="checks">
        <label v-for="s in SENSORES" :key="s.k">
          <input v-if="midiendo" type="checkbox" :checked="marcados.includes(s.k)" />
          <input v-else v-model="elegidos" type="checkbox" :value="s.k" />
          <span>{{ s.nombre }}<small>{{ s.desc }}</small></span>
        </label>
      </div>
    </fieldset>

    <button type="submit" :class="midiendo ? 'detener' : 'iniciar'" :disabled="!puedeEnviar">
      {{ enviando ? 'Guardando…' : midiendo ? 'Detener grabación' : 'Iniciar grabación' }}
    </button>
    <p v-if="error" class="estado err" role="alert">{{ error }}</p>

    <p v-if="store.errores.estado" class="estado err" role="alert">Sin conexión con la API de grabación.</p>
    <p v-else-if="!store.estado" class="estado">Consultando el estado de grabación…</p>
    <p v-else-if="!puenteDisponible" class="estado warn">Puente sin conexión. <RouterLink to="/puente">Ver diagnóstico</RouterLink>.</p>
    <template v-else>
      <p class="estado">
        <RouterLink to="/dispositivos">{{ puente?.dispositivo || 'Puente Polar' }}</RouterLink>
        <template v-if="midiendo">
          · {{ puente?.activos?.length ? puente.activos.map((k) => NOMBRE[k] ?? k).join(', ') : 'Esperando señales del sensor' }}
        </template>
      </p>
      <p v-for="(msg, k) in midiendo ? puente?.errores : {}" :key="k" class="estado err">{{ NOMBRE[k] ?? k }} · {{ msg }}</p>
    </template>
  </form>
</template>

<style scoped>
.panel-sesion fieldset { border: 0; min-width: 0; margin-bottom: 1rem; }
.panel-sesion select, .panel-sesion input[type="text"] { width: 100%; margin-bottom: 0.75rem; }
.sesion-activa { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.sesion-activa span { font-variant-numeric: tabular-nums; }
</style>
