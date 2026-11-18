<script setup>
import { api } from '../api.js'
import { NOMBRE, hora } from '../catalogo.js'
import { store } from '../store.js'

defineEmits(['ver'])
const resumen = (m) => Object.entries(m ?? {}).map(([k, n]) => `${NOMBRE[k] ?? (k === 'rr' ? 'RR' : k)}: ${n}`).join(' · ')
</script>

<template>
  <div class="card full">
    <h2>Sesiones de medición <span class="derecha">desde que se inicia hasta que se detiene</span></h2>
    <div class="tabla-scroll">
      <table>
        <thead>
          <tr><th>sesión</th><th>sujeto</th><th>inicio</th><th>fin</th><th>datos</th><th>filas guardadas</th><th>descargar</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in store.sesiones.slice(0, 20)" :key="s.id_sesion">
            <td>{{ s.id_sesion }}</td>
            <td>{{ s.sujeto }}</td>
            <td>{{ hora(s.fecha_inicio) }}</td>
            <td><span v-if="!s.fecha_fin" class="ok">● en curso</span><template v-else>{{ hora(s.fecha_fin) }}</template></td>
            <td>{{ s.datos.map((k) => NOMBRE[k]).join(', ') }}</td>
            <td>{{ resumen(s.muestras) }}</td>
            <td>
              <a href="#" @click.prevent="$emit('ver', s.id_sesion)">📈 ver gráfico</a> ·
              <a :href="api.urlJson(s.id_sesion)">JSON</a> · <a :href="api.urlVerJson(s.id_sesion)" target="_blank">ver JSON</a><br />
              CSV: <template v-for="k in [...s.datos, ...(s.datos.includes('fc') ? ['rr'] : [])]" :key="k"><a :href="api.urlCsv(s.id_sesion, k)">{{ k }}</a>{{ ' ' }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
