<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { api } from '../api.js'
import { CONF, NOMBRE, hora } from '../catalogo.js'
import GraficoSerie from './GraficoSerie.vue'

const props = defineProps({
  sesion: { type: Object, default: null },
  enVivo: Boolean,
  erroresSensor: { type: Object, default: () => ({}) },
})

const ventana = ref(props.enVivo ? 60 : 0)
const posicion = ref(0)
const resultado = ref(null)
const error = ref('')
const claves = computed(() => (props.sesion?.datos ?? []).filter((clave) => Object.hasOwn(CONF, clave)))
const sinMuestras = computed(() => claves.value.filter((clave) => !resultado.value?.series[clave]?.length))
const segundos = computed(() => {
  if (!props.sesion?.fecha_inicio || !resultado.value) return 0
  return Math.max(0, Math.round((resultado.value.fin - Date.parse(props.sesion.fecha_inicio)) / 1000))
})

let ocupado = false
let repetir = false
let desmontado = false
let intervalo
let espera
let version = 0

async function cargar() {
  if (desmontado || !props.sesion?.fecha_inicio) return
  if (ocupado) {
    repetir = true
    return
  }

  const { id_sesion, fecha_inicio, fecha_fin } = props.sesion
  const solicitud = version
  const inicio = Date.parse(fecha_inicio)
  const fin = Math.max(inicio + 1, fecha_fin ? Date.parse(fecha_fin) : Date.now())
  const ancho = ventana.value ? Math.min(ventana.value * 1000, fin - inicio) : fin - inicio
  const desde = props.enVivo ? fin - ancho : inicio + (posicion.value / 1000) * (fin - inicio - ancho)
  const hasta = desde + ancho

  ocupado = true
  try {
    const { series } = await api.series(id_sesion, desde, hasta)
    if (!desmontado && solicitud === version) {
      resultado.value = { series, desde, hasta, fin }
      error.value = ''
    }
  } catch (e) {
    if (!desmontado && solicitud === version) error.value = e.message
  } finally {
    ocupado = false
    if (repetir) {
      repetir = false
      cargar()
    }
  }
}

function cambiarRango(demora = 0) {
  version++
  clearTimeout(espera)
  if (demora) espera = setTimeout(cargar, demora)
  else cargar()
}

watch([() => props.sesion?.id_sesion, () => props.sesion?.fecha_fin], ([id], [anterior]) => {
  if (id !== anterior) {
    resultado.value = null
    error.value = ''
    posicion.value = 0
  }
  cambiarRango()
})

onMounted(() => {
  cargar()
  if (props.enVivo) intervalo = setInterval(cargar, 1500)
})
onBeforeUnmount(() => {
  desmontado = true
  clearInterval(intervalo)
  clearTimeout(espera)
})
</script>

<template>
  <section id="grafico-sesion" class="card full">
    <h2>{{ enVivo ? 'Señales en vivo' : 'Informe de sesión' }}</h2>
    <p v-if="!sesion" class="estado">{{ enVivo ? 'Inicia una grabación para ver las señales.' : 'Selecciona una sesión en el historial.' }}</p>
    <template v-else>
      <p class="estado">
        #{{ sesion.id_sesion }} · {{ sesion.nombre_sesion || sesion.sujeto }}
        <template v-if="sesion.ubicacion"> · {{ sesion.ubicacion }}</template>
        <template v-if="resultado"> · {{ segundos }} s registrados</template>
      </p>
      <div class="controles">
        <label for="ventana-grafico">Ventana</label>
        <select id="ventana-grafico" v-model.number="ventana" @change="cambiarRango()">
          <option :value="10">10 segundos</option>
          <option :value="30">30 segundos</option>
          <option :value="60">1 minuto</option>
          <option :value="300">5 minutos</option>
          <option :value="0">Toda la sesión</option>
        </select>
        <button v-if="!enVivo && !sesion.fecha_fin" type="button" class="secundario" @click="cargar">Actualizar</button>
        <span v-if="resultado">{{ hora(resultado.desde) }} – {{ hora(resultado.hasta) }}</span>
      </div>
      <div v-if="!enVivo && ventana && segundos > ventana" class="controles">
        <label for="posicion-grafico">Revisar tramo</label>
        <input id="posicion-grafico" v-model.number="posicion" type="range" min="0" max="1000" @input="cambiarRango(120)" />
      </div>
      <p v-if="error" class="estado err" role="alert">No se pudieron cargar las series. {{ error }}</p>
      <p v-else-if="!resultado" class="estado">Cargando las señales…</p>
      <div v-else>
        <p v-if="sinMuestras.length" class="estado warn">Señales sin muestras en este tramo · {{ sinMuestras.map((clave) => NOMBRE[clave]).join(', ') }}</p>
        <GraficoSerie
          v-for="clave in claves.filter((k) => resultado.series[k]?.length)"
          :key="sesion.id_sesion + clave"
          :clave="clave"
          :puntos="resultado.series[clave]"
          :desde="resultado.desde"
          :hasta="resultado.hasta"
        />
      </div>
      <p v-for="(mensaje, clave) in erroresSensor" :key="clave" class="estado err">{{ NOMBRE[clave] ?? clave }} · {{ mensaje }}</p>
    </template>
  </section>
</template>
