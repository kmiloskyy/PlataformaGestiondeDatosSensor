<script setup>
// Vista del gráfico de una sesión: elige la sesión, el ancho de la ventana (10 s ... toda la sesión)
// y permite deslizarla del pasado al presente. Con "Seguir en vivo" la ventana acompaña a la sesión en curso.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { api } from '../api.js'
import { hora } from '../catalogo.js'
import { store } from '../store.js'
import GraficoSerie from './GraficoSerie.vue'

const seleccion = ref('actual')        // 'actual' = la sesión en curso o, si no hay, la última
const ventana = ref(60)                // segundos visibles; 0 = toda la sesión
const seguir = ref(true)
const pos = ref(1000)                  // posición del deslizador: 0 = inicio de la sesión, 1000 = presente
const rango = reactive({ desde: 0, hasta: 1 })
const series = ref({})
const total = ref(0)

const sesion = computed(() => {
  const l = store.sesiones
  if (!l.length) return null
  if (seleccion.value === 'actual') return (store.estado.midiendo && l.find((s) => s.id_sesion === store.estado.id_sesion)) || l[0]
  return l.find((s) => s.id_sesion === Number(seleccion.value)) || l[0]
})
const claves = computed(() => (sesion.value?.datos ?? []).filter((k) => ['fc', 'acc', 'gyro', 'mag', 'ppg', 'ppi'].includes(k)))
const sinDeslizar = computed(() => ventana.value === 0 || total.value <= ventana.value * 1000)

let ocupado = false, repetir = false
async function cargar() {
  if (ocupado) { repetir = true; return }
  ocupado = true
  try {
    const s = sesion.value
    if (!s) return
    const ini = Date.parse(s.fecha_inicio)
    const fin = s.fecha_fin ? Date.parse(s.fecha_fin) : Date.now()
    total.value = Math.max(fin - ini, 1000)
    const w = ventana.value === 0 ? total.value : ventana.value * 1000
    let desde, hasta
    if (ventana.value === 0 || total.value <= w) { desde = ini; hasta = fin }
    else if (seguir.value && !s.fecha_fin) { hasta = fin; desde = fin - w; pos.value = 1000 }
    else { desde = ini + (pos.value / 1000) * (total.value - w); hasta = desde + w }
    const r = await api.series(s.id_sesion, desde, hasta)
    series.value = r.series
    rango.desde = desde; rango.hasta = hasta
  } catch (e) { console.error(e) } finally {
    ocupado = false
    if (repetir) { repetir = false; cargar() }
  }
}

let temporizador, refresco
function alDeslizar() { seguir.value = false; clearTimeout(temporizador); temporizador = setTimeout(cargar, 120) }
function alElegirSesion() { seguir.value = seleccion.value === 'actual'; pos.value = seguir.value ? 1000 : 0; cargar() }
function alSeguir() { if (seguir.value) pos.value = 1000; cargar() }
function ver(id) { seleccion.value = String(id); seguir.value = false; pos.value = 0; cargar(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
defineExpose({ ver })

watch(() => sesion.value?.id_sesion, cargar)
onMounted(() => { refresco = setInterval(() => { if (sesion.value && !sesion.value.fecha_fin && seguir.value) cargar() }, 1500); cargar() })
onBeforeUnmount(() => { clearInterval(refresco); clearTimeout(temporizador) })
</script>

<template>
  <div class="card full">
    <h2>
      Gráfico de la sesión
      <span class="derecha" v-if="sesion">sesión {{ sesion.id_sesion }} · {{ sesion.sujeto }} · {{ sesion.fecha_fin ? 'terminada' : 'en curso' }} · {{ Math.round(total / 1000) }} s en total</span>
      <span class="derecha" v-else>Aún no hay sesiones</span>
    </h2>

    <div class="controles">
      <span>Sesión:
        <select v-model="seleccion" @change="alElegirSesion">
          <option value="actual">En curso / la última</option>
          <option v-for="s in store.sesiones" :key="s.id_sesion" :value="String(s.id_sesion)">#{{ s.id_sesion }} · {{ s.sujeto }} · {{ hora(s.fecha_inicio) }}</option>
        </select>
      </span>
      <span>Ver:
        <select v-model.number="ventana" @change="cargar">
          <option :value="10">10 s</option><option :value="30">30 s</option><option :value="60">1 min</option>
          <option :value="300">5 min</option><option :value="0">Toda la sesión</option>
        </select>
      </span>
      <label class="en-linea"><input type="checkbox" v-model="seguir" @change="alSeguir" /> Seguir en vivo</label>
      <span v-if="rango.hasta > 1">{{ hora(rango.desde) }} – {{ hora(rango.hasta) }}</span>
    </div>
    <div class="controles">
      <span>◀ pasado</span>
      <input type="range" min="0" max="1000" v-model.number="pos" :disabled="sinDeslizar" @input="alDeslizar" />
      <span>presente ▶</span>
    </div>

    <GraficoSerie v-for="k in claves" :key="(sesion?.id_sesion ?? 0) + k" :clave="k" :puntos="series[k] ?? []" :desde="rango.desde" :hasta="rango.hasta" />
  </div>
</template>
