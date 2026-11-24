<script setup>
import { computed, watch } from 'vue'
import { explicarFc } from '../catalogo.js'
import { sondear, store } from '../store.js'

const idSesion = computed(() => !store.errores.estado && store.estado?.midiendo ? store.estado.id_sesion : null)
watch(idSesion, (id, _, alLimpiar) => {
  if (id != null) alLimpiar(sondear('ultimo'))
}, { immediate: true })

const lectura = computed(() => {
  if (idSesion.value == null || store.errores.ultimo) return null
  return store.ultimo?.id_sesion === idSesion.value ? store.ultimo : null
})
const bpm = computed(() => lectura.value?.fc_edad_s != null && lectura.value.fc_edad_s < 5
  ? lectura.value.frecuencia_cardiaca : '—')

const json = computed(() => {
  const paquete = lectura.value?.paquete
  if (!paquete) return ''
  const vista = Object.fromEntries(Object.entries(paquete).map(([clave, valor]) => [
    clave,
    Array.isArray(valor) && valor.length > 2 && typeof valor[0] === 'object'
      ? [...valor.slice(0, 2), `… (${valor.length} muestras)`] : valor,
  ]))
  return JSON.stringify(vista, null, 2)
})
</script>

<template>
  <section class="card">
    <h2>Últimas lecturas</h2>
    <div class="bpm">{{ bpm }} <small>lpm</small></div>
    <p v-if="store.errores.estado || (idSesion != null && store.errores.ultimo)" class="estado err" role="alert">No se pudieron consultar las lecturas.</p>
    <p v-else-if="idSesion == null" class="estado">Inicia una grabación para ver las lecturas.</p>
    <p v-else-if="!lectura?.paquete" class="estado">Esperando el primer paquete del sensor.</p>
    <p v-else-if="lectura.edad_s < 5" class="estado ok">Recibiendo datos</p>
    <p v-else class="estado warn">Última lectura hace {{ Math.round(lectura.edad_s) }} s</p>

    <template v-if="lectura?.fc_crudo">
      <h3>Bytes de frecuencia cardíaca</h3>
      <pre>{{ explicarFc(lectura.fc_crudo) }}</pre>
    </template>
    <template v-if="json">
      <h3>Muestras recientes</h3>
      <pre>{{ json }}</pre>
    </template>
  </section>
</template>
