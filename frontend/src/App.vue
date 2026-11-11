<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from './api/axios';

// Definir la interfaz de los datos esperados
interface Rol {
  id_Rol: number;
  Profesor: string;
  Alumno: string;
}

const roles = ref<Rol[]>([]);
const cargando = ref<boolean>(true);
const error = ref<string | null>(null);

const obtenerRoles = async () => {
  try {
    const respuesta = await api.get<Rol[]>('/test-db');
    roles.value = respuesta.data;
  } catch (err: any) {
    error.value = 'Error al conectar con el servidor: ' + err.message;
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  obtenerRoles();
});
</script>

<template>
  <div style="padding: 20px;">
    <h1>Integración Vue 3 + NestJS</h1>

    <p v-if="cargando">Cargando datos de PostgreSQL...</p>
    <p v-else-if="error" style="color: red;">{{ error }}</p>

    <ul v-else>
      <li v-for="rol in roles" :key="rol.id_Rol">
        ID: {{ rol.id_Rol }} | Profesor: {{ rol.Profesor }} | Alumno: {{ rol.Alumno }}
      </li>
    </ul>
  </div>
</template>
