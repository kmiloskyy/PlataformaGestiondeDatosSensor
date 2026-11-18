<script setup>
import { computed } from 'vue'
import { explicarFc } from '../catalogo.js'
import { store } from '../store.js'

const u = computed(() => store.ultimo)
const fresco = computed(() => u.value?.fc_edad_s != null && u.value.fc_edad_s < 5)
const bpm = computed(() => (fresco.value ? u.value.frecuencia_cardiaca : '--'))

// Se muestran solo las primeras muestras de cada arreglo para que el JSON sea legible.
const json = computed(() => {
  const p = u.value?.paquete
  if (!p) return '(esperando datos…)'
  const m = {}
  for (const [k, v] of Object.entries(p)) {
    m[k] = Array.isArray(v) && v.length && typeof v[0] === 'object' ? [...v.slice(0, 2), `… (${v.length} muestras en este segundo)`] : v
  }
  return JSON.stringify(m, null, 1)
})
</script>

<template>
  <div class="card">
    <h2>2. Así llegan los datos</h2>
    <div class="bpm"><span>{{ bpm }}</span> <small>lpm</small></div>
    <div class="estado">
      <template v-if="!u?.paquete">Aún no ha llegado ningún dato.</template>
      <span v-else-if="u.edad_s < 5" class="ok">● Llegando datos</span>
      <span v-else class="warn">Último dato hace {{ Math.round(u.edad_s) }} s</span>
    </div>
    <div class="estado">Último paquete de frecuencia cardíaca (bytes crudos) y lo que significa:</div>
    <pre>{{ u?.fc_crudo ? explicarFc(u.fc_crudo) : '(esperando datos…)' }}</pre>
    <div class="estado">Último segundo guardado (cada muestra cruda; aquí solo las primeras):</div>
    <pre>{{ json }}</pre>
  </div>
</template>
