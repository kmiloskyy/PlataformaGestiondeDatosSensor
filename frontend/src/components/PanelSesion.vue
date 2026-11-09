<script setup>
import { computed, ref, watch } from 'vue'
import { api } from '../api.js'
import { NOMBRE, SENSORES } from '../catalogo.js'
import { refrescarEstado, refrescarSesiones, store } from '../store.js'

// Los datos elegidos se recuerdan entre visitas (solo comodidad; la sesión guarda los suyos en la base de datos).
let guardado = null
try { guardado = JSON.parse(localStorage.getItem('datosElegidos') || 'null') } catch { /* sin almacenamiento */ }
const elegidos = ref(Array.isArray(guardado) ? guardado : ['fc', 'acc'])
const idSujeto = ref(null)
const error = ref('')

watch(elegidos, (v) => { try { localStorage.setItem('datosElegidos', JSON.stringify(v)) } catch { /* nada */ } })
watch(() => store.sujetos, (s) => { if (idSujeto.value == null && s.length) idSujeto.value = s[0].id_sujeto }, { immediate: true })

const midiendo = computed(() => store.estado.midiendo)
// Mientras hay sesión, las casillas muestran lo que realmente se está midiendo.
const marcados = computed(() => (midiendo.value ? store.estado.datos : elegidos.value))
const puente = computed(() => store.estado.puente ?? {})
const puenteVivo = computed(() => puente.value.visto_hace_s != null && puente.value.visto_hace_s <= 5)

async function alternar() {
  error.value = ''
  try {
    if (midiendo.value) await api.detener()
    else {
      if (!elegidos.value.length) { error.value = 'Elige al menos un dato para medir.'; return }
      if (idSujeto.value == null) { error.value = 'No hay sujetos de estudio registrados.'; return }
      await api.iniciar(idSujeto.value, elegidos.value)
    }
    await Promise.all([refrescarEstado(), refrescarSesiones()])
  } catch (e) { error.value = e.message }
}
function marcar(k, valor) {
  elegidos.value = valor ? [...new Set([...elegidos.value, k])] : elegidos.value.filter((x) => x !== k)
}
</script>

<template>
  <div class="card">
    <h2>1. Sesión de medición</h2>
    <label for="sujeto">Sujeto de estudio</label>
    <select id="sujeto" v-model="idSujeto" :disabled="midiendo">
      <option v-for="s in store.sujetos" :key="s.id_sujeto" :value="s.id_sujeto">{{ s.Nombre }} (id {{ s.id_sujeto }})</option>
    </select>

    <label>Datos a medir (elígelos antes de iniciar)</label>
    <div class="checks">
      <label v-for="s in SENSORES" :key="s.k">
        <input type="checkbox" :checked="marcados.includes(s.k)" :disabled="midiendo" @change="marcar(s.k, $event.target.checked)" />
        <span>{{ s.nombre }}<small>{{ s.desc }}</small></span>
      </label>
    </div>

    <button :class="midiendo ? 'detener' : 'iniciar'" @click="alternar">{{ midiendo ? '⏹ Detener sesión' : '▶ Iniciar sesión' }}</button>
    <div v-if="error" class="estado err">{{ error }}</div>

    <div class="estado">
      <template v-if="midiendo">
        <span class="ok">● Sesión {{ store.estado.id_sesion }} en curso</span> — {{ store.estado.sujeto }} —
        {{ store.estado.datos.map((k) => NOMBRE[k]).join(', ') }}
      </template>
      <template v-else>Sin sesión en curso. Elige los datos y pulsa Iniciar.</template>
    </div>
    <div class="estado">
      <template v-if="!puenteVivo">
        <span class="err">✖ Puente no detectado.</span> Ejecuta <code>puente\bin\puente-polar.exe</code> (es el programa que lee el sensor).
      </template>
      <template v-else>
        <span class="ok">✔ Puente conectado</span><template v-if="puente.dispositivo"> ({{ puente.dispositivo }})</template>
        <template v-if="midiendo"> — midiendo: {{ (puente.activos ?? []).map((k) => NOMBRE[k] ?? k).join(', ') || 'nada' }}</template>
        <div v-for="(msg, k) in puente.errores" :key="k" class="err">✖ {{ NOMBRE[k] ?? k }}: {{ msg }}</div>
      </template>
    </div>
    <div v-if="store.sinConexion" class="estado err">✖ Sin conexión con el backend (¿está corriendo <code>npm run start:dev</code>?).</div>
  </div>
</template>
