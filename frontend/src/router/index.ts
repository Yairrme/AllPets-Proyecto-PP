import { createRouter, createWebHistory } from 'vue-router'
import PaseadoresView from '../views/PaseadoresView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/paseadores',
    },
    {
      path: '/paseadores',
      name: 'paseadores',
      component: PaseadoresView,
    },
  ],
})

export default router
