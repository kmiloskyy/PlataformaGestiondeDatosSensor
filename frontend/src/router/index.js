import { createRouter, createWebHistory } from 'vue-router'

import Inicio      from '../../views/inicio.vue'
import Grabacion   from '../../views/grabacion.vue'
import Sesiones    from '../../views/sesiones.vue'
import Vinculacion from '../../views/vinculacion.vue'

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
        path: '/vinculacion',
        name: 'Vinculacion',
        component: Vinculacion
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router