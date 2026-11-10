import { createRouter, createWebHistory, routerKey } from 'vue-router'


import Inicio from '/views/inicio.vue'
import Grabacion from '../../views/grabacion.vue'
import Sesiones from '../../views/sesiones.vue'

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
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router