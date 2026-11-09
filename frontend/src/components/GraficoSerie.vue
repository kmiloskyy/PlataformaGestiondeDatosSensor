<script setup>
// Un gráfico de línea (Chart.js) para UN dato del sensor. El eje X es el tiempo real; la ventana (desde/hasta) la manda el padre.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, Tooltip, Legend } from 'chart.js'
import { CONF } from '../catalogo.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, Tooltip, Legend)

const props = defineProps({
  clave: { type: String, required: true },
  puntos: { type: Array, default: () => [] }, // cada punto: [t_ms, valor1, valor2, ...]
  desde: { type: Number, required: true },
  hasta: { type: Number, required: true },
})

const canvas = ref(null)
let grafico = null
const conf = CONF[props.clave]

function pintar() {
  if (!grafico) return
  conf.series.forEach((_, n) => {
    grafico.data.datasets[n].data = props.puntos.filter((p) => p[n + 1] != null).map((p) => ({ x: p[0], y: p[n + 1] }))
  })
  grafico.options.scales.x.min = props.desde
  grafico.options.scales.x.max = props.hasta
  grafico.update()
}

onMounted(() => {
  const texto = '#94a3b8'
  grafico = new Chart(canvas.value, {
    type: 'line',
    data: {
      datasets: conf.series.map(([label, color]) => ({
        label, data: [], borderColor: color, backgroundColor: color, borderWidth: conf.puntos ? 2 : 1.3,
        pointRadius: conf.puntos ? 2 : 0, tension: conf.puntos ? 0.25 : 0,
      })),
    },
    options: {
      animation: false, maintainAspectRatio: false, parsing: false, normalized: true,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        title: { display: true, text: conf.titulo, color: '#e2e8f0' },
        legend: { labels: { color: '#e2e8f0', boxWidth: 12 } },
        tooltip: { callbacks: { title: (it) => new Date(it[0].parsed.x).toLocaleTimeString() } },
      },
      scales: {
        x: { type: 'linear', ticks: { color: texto, maxTicksLimit: 8, callback: (v) => new Date(v).toLocaleTimeString() }, grid: { color: '#334155' } },
        y: { ticks: { color: texto }, grid: { color: '#334155' } },
      },
    },
  })
  pintar()
})
watch(() => [props.puntos, props.desde, props.hasta], pintar)
onBeforeUnmount(() => grafico?.destroy())
</script>

<template>
  <div class="grafico"><canvas ref="canvas"></canvas></div>
</template>
