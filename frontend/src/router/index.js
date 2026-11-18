import { createRouter, createWebHistory } from 'vue-router'

import Inicio from '../../views/inicio.vue'
import Grabacion from '../../views/grabacion.vue'
import Sesiones from '../../views/sesiones.vue'
import Dispositivos from '../../views/dispositivos.vue'
import Puente from '../../views/puente.vue'

const routes = [
  {
    path: '/',
    name: 'Inicio',
    component: Inicio
  },
  {
    path: '/grabacion',
    name: 'Grabacion',
    component: Grabacion
  },
  {
    path: '/sesiones',
    name: 'Sesiones',
    component: Sesiones
  },
  {
    path: '/dispositivos',
    name: 'Dispositivos',
    component: Dispositivos
  },
  {
    path: '/puente',
    name: 'Puente',
    component: Puente
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
