<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import GraficoSesion from '../src/components/GraficoSesion.vue'
import TablaSesiones from '../src/components/TablaSesiones.vue'
import { sondear, store } from '../src/store.js'
import { esProfesor } from '../src/auth.js'

const busqueda = ref('')
const seleccion = ref(null)
const informe = ref(null)
const sesiones = computed(() => (store.sesiones ?? []).filter((sesion) => {
  const termino = busqueda.value.trim().toLocaleLowerCase()
  return [sesion.nombre_sesion, sesion.sujeto, sesion.ubicacion, sesion.direccion_mac, String(sesion.id_sesion)].some((valor) =>
    valor?.toLocaleLowerCase().includes(termino))
}))
const sesion = computed(() => store.sesiones?.find((s) => s.id_sesion === seleccion.value) ?? null)

let detener
onMounted(() => { detener = sondear('sesiones', 3000) })
onBeforeUnmount(() => detener?.())

async function ver(id) {
  seleccion.value = id
  await nextTick()
  informe.value?.focus()
}

function imprimir() { window.print() }
</script>

<template>
  <div class="medicion-view sesiones-view">
    <header class="pagina-encabezado">
      <h1>{{ esProfesor ? 'Sesiones y reportes' : 'Mis sesiones' }}</h1>
      <p v-if="!esProfesor">Aquí ves solo tus propias grabaciones.</p>
      <p v-else>Revisa las grabaciones guardadas, grafica un tramo y descarga las muestras en CSV o JSON.</p>
    </header>
    <div class="medicion-grid">
      <section class="card full historial">
        <div class="controles">
          <label for="buscar-sesion">Buscar sesión</label>
          <input id="buscar-sesion" v-model="busqueda" type="search" placeholder="Nombre, sujeto, ubicación o MAC" />
          <RouterLink v-if="esProfesor" to="/grabacion">Nueva grabación</RouterLink>
        </div>
        <p v-if="store.errores.sesiones" class="estado err" role="alert">No se pudieron consultar las sesiones.</p>
        <p v-else-if="!store.sesiones" class="estado">Cargando sesiones…</p>
        <p v-else-if="!store.sesiones.length" class="estado">Aún no hay grabaciones guardadas.</p>
        <p v-else-if="!sesiones.length" class="estado">No hay sesiones que coincidan con la búsqueda.</p>
        <TablaSesiones v-if="sesiones.length" :sesiones="sesiones" :seleccionada="seleccion" @ver="ver" />
      </section>
      <div v-if="sesion" ref="informe" class="full informe" tabindex="-1">
        <GraficoSesion :sesion="sesion" />
        <button class="secundario imprimir" type="button" @click="imprimir">Imprimir informe</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.imprimir { margin-top: 0.75rem; }
@media print {
  .historial, .imprimir { display: none; }
}
</style>
