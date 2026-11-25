<script setup>
import { api } from '../api.js'
import { NOMBRE } from '../catalogo.js'

defineProps({ sesiones: { type: Array, required: true }, seleccionada: Number })
defineEmits(['ver'])

const fecha = (iso) => new Date(iso).toLocaleString()
const resumen = (muestras) => Object.entries(muestras).map(([clave, cantidad]) =>
  `${NOMBRE[clave] ?? (clave === 'rr' ? 'RR' : clave)} · ${cantidad.toLocaleString()}`).join(', ')
</script>

<template>
  <div class="tabla-scroll">
    <table>
      <thead>
        <tr><th>Sesión</th><th>Sujeto</th><th>Sensor</th><th>Ubicación</th><th>Inicio y fin</th><th>Muestras guardadas</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        <tr v-for="sesion in sesiones" :key="sesion.id_sesion">
          <th scope="row">{{ sesion.nombre_sesion || `Sesión #${sesion.id_sesion}` }}</th>
          <td>{{ sesion.sujeto || '—' }}</td>
          <td>
            {{ sesion.sensores?.join(', ') || (sesion.direccion_mac ? 'Polar' : '—') }}
            <template v-if="sesion.direccion_mac"><br />{{ sesion.direccion_mac }}</template>
          </td>
          <td>{{ sesion.ubicacion || '—' }}</td>
          <td>
            {{ fecha(sesion.fecha_inicio) }}<br />
            <span v-if="sesion.fecha_fin">{{ fecha(sesion.fecha_fin) }}</span>
            <span v-else class="ok">En curso</span>
          </td>
          <td>{{ resumen(sesion.muestras ?? {}) || 'Sin muestras' }}</td>
          <td>
            <div class="acciones-sesion">
              <button type="button" class="secundario" :aria-pressed="sesion.id_sesion === seleccionada" @click="$emit('ver', sesion.id_sesion)">Ver informe</button>
              <a href="#" @click.prevent="api.descargarJson(sesion.id_sesion).catch((e) => alert(e.message))">JSON</a>
            </div>
            <div class="acciones-sesion">
              <a v-for="clave in Object.keys(sesion.muestras ?? {})" :key="clave" :href="'#'" @click.prevent="api.descargarCsv(sesion.id_sesion, clave).catch((e) => alert(e.message))">CSV {{ clave.toUpperCase() }}</a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.acciones-sesion { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.8rem; }
.acciones-sesion + .acciones-sesion:not(:empty) { margin-top: 0.4rem; }
</style>
