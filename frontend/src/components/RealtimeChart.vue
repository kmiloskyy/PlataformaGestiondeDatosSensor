<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler)

const props = defineProps({
  titulo: { type: String, default: 'Frecuencia Cardíaca en Tiempo Real (BPM)' },
  labels: { type: Array, required: true },
  datasets: { type: Array, required: true },
  yMin: { type: Number, default: null },
  yMax: { type: Number, default: null },
  unidad: { type: String, default: 'BPM' }
})

const canvasRef = ref(null)
let chartInstance = null

function inicializarGrafico() {
  if (!canvasRef.value) return

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: props.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#334155', font: { weight: '600', size: 12 } }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10
        }
      },
      scales: {
        x: {
          grid: { color: '#e2e8f0' },
          ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }
        },
        y: {
          min: props.yMin,
          max: props.yMax,
          grid: { color: '#e2e8f0' },
          ticks: {
            color: '#64748b',
            callback: (val) => `${val} ${props.unidad}`
          }
        }
      }
    }
  })
}

function actualizarGrafico() {
  if (!chartInstance) return
  chartInstance.data.labels = props.labels
  props.datasets.forEach((ds, i) => {
    if (chartInstance.data.datasets[i]) {
      chartInstance.data.datasets[i].data = ds.data
    } else {
      chartInstance.data.datasets.push(ds)
    }
  })
  chartInstance.update('none')
}

onMounted(() => {
  inicializarGrafico()
})

watch(() => [props.labels.length, props.datasets], () => {
  actualizarGrafico()
}, { deep: true })

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy()
})
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <h4>{{ titulo }}</h4>
    </div>
    <div class="canvas-wrapper">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  height: 280px;
}
.chart-header {
  margin-bottom: 0.5rem;
}
.chart-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
}
.canvas-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
}
</style>
