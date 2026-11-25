import { createRouter, createWebHistory } from 'vue-router'

import Inicio from '../../views/inicio.vue'
import Grabacion from '../../views/grabacion.vue'
import Sesiones from '../../views/sesiones.vue'
import Dispositivos from '../../views/dispositivos.vue'
import Puente from '../../views/puente.vue'
import Login from '../../views/login.vue'
import { autenticado, esProfesor } from '../auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Inicio',
    component: Inicio
  },
  {
    path: '/grabacion',
    name: 'Grabacion',
    component: Grabacion,
    meta: { soloProfesor: true }
  },
  {
    path: '/sesiones',
    name: 'Sesiones',
    component: Sesiones
  },
  {
    path: '/dispositivos',
    name: 'Dispositivos',
    component: Dispositivos,
    meta: { soloProfesor: true }
  },
  {
    path: '/puente',
    name: 'Puente',
    component: Puente,
    meta: { soloProfesor: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Sin sesión solo se puede ver el login; con sesión, el login redirige al inicio.
router.beforeEach((to) => {
  if (to.name !== 'Login' && !autenticado()) return { name: 'Login', query: { redirect: to.fullPath } }
  if (to.name === 'Login' && autenticado()) return { path: '/' }
  // Grabar, sensores y puente son solo del profesor; el alumno vuelve al inicio.
  if (to.meta.soloProfesor && !esProfesor.value) return { path: '/' }
})

export default router
