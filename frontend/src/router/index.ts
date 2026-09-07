import { createRouter, createWebHistory } from 'vue-router'
import PaseadoresView from '../views/PaseadoresView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import RegisterWorkerView from '../views/RegisterWorkerView.vue'
import WorkerOnboardingView from '../views/WorkerOnboardingView.vue'
import WorkerDashboardView from '../views/WorkerDashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/paseadores',
      name: 'paseadores',
      component: PaseadoresView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/trabaja-con-nosotros',
      name: 'register-worker',
      component: RegisterWorkerView,
    },
    {
      path: '/onboarding-trabajador',
      name: 'onboarding-worker',
      component: WorkerOnboardingView,
    },
    {
      path: '/mi-panel',
      name: 'worker-dashboard',
      component: WorkerDashboardView,
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  if ((to.name === 'login' || to.name === 'register') && token && user) {
    next(user.role === 'client' ? '/paseadores' : '/mi-panel')
    return
  }

  if (to.name === 'worker-dashboard' && (!token || !user || !['walker', 'caregiver'].includes(user.role))) {
    next('/login')
    return
  }

  if (to.name === 'onboarding-worker' && (!token || !user || !['walker', 'caregiver'].includes(user.role))) {
    next('/trabaja-con-nosotros')
    return
  }

  next()
})

export default router
