/**
 * ============================================================================
 * ARCHIVO: router/index.ts
 * ROL EN LA ARQUITECTURA: Configuración central de Vue Router y Guards de Seguridad.
 * ============================================================================
 * Descripción general:
 * Define el mapa de rutas de la Single Page Application (SPA), el comportamiento
 * del desplazamiento (scroll) al cambiar de vista o ancla (`#hash`), y los
 * Navigation Guards (`beforeEach`) que protegen las rutas privadas según el token
 * JWT y el rol del usuario (`client`, `walker` o `caregiver`).
 */

import { createRouter, createWebHistory } from 'vue-router'
import PaseadoresView from '../views/PaseadoresView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import RegisterWorkerView from '../views/RegisterWorkerView.vue'
import WorkerOnboardingView from '../views/WorkerOnboardingView.vue'
import WorkerDashboardView from '../views/WorkerDashboardView.vue'
import ClientProfileView from '../views/ClientProfileView.vue'

const router = createRouter({
  // Usa el historial HTML5 nativo del navegador para URLs limpias sin '#'
  history: createWebHistory(import.meta.env.BASE_URL),

  /**
   * Controla la posición del scroll al navegar entre rutas:
   * - Si el usuario usa los botones Atrás/Adelante del navegador, restaura `savedPosition`.
   * - Si la ruta destino incluye un hash (ej. `#beneficios`), hace scroll suave con un margen superior de 120px.
   * - Si cambia de ruta, espera 300ms (para coincidir con la transición de salida) y sube al inicio.
   */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    const scrollTarget = () => {
      if (to.hash) {
        return { el: to.hash, top: 120, behavior: 'smooth' as const }
      }
      return { top: 0, behavior: 'smooth' as const }
    }
    if (to.path === from.path) {
      return scrollTarget()
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(scrollTarget())
      }, 300)
    })
  },

  // Definición de todas las rutas disponibles en el frontend
  routes: [
    {
      // Redirección automática desde la raíz hacia el catálogo principal de paseadores
      path: '/',
      redirect: '/paseadores',
    },
    {
      // Catálogo público de paseadores y cuidadores con filtros y modal de perfil
      path: '/paseadores',
      name: 'paseadores',
      component: PaseadoresView,
    },
    {
      // Pantalla de inicio de sesión para clientes y trabajadores
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      // Formulario de registro exclusivo para dueños de mascotas (rol 'client')
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      // Landing + formulario de registro para trabajadores ('walker' o 'caregiver')
      path: '/trabaja-con-nosotros',
      name: 'register-worker',
      component: RegisterWorkerView,
    },
    {
      // Paso inicial post-registro para que el trabajador configure su perfil profesional
      path: '/onboarding-trabajador',
      name: 'onboarding-worker',
      component: WorkerOnboardingView,
    },
    {
      // Panel de autogestión del trabajador (perfil, certificaciones, galería y reseñas)
      path: '/mi-panel',
      name: 'worker-dashboard',
      component: WorkerDashboardView,
    },
    {
      // Vista privada de perfil personal para usuarios con rol 'client'
      path: '/mi-perfil',
      name: 'client-profile',
      component: ClientProfileView,
    },
  ],
})

/**
 * GUARDIA DE NAVEGACIÓN GLOBAL (Navigation Guard - beforeEach):
 * Se ejecuta antes de cada cambio de ruta para validar permisos de acceso:
 * 1. Evita que un usuario ya autenticado vuelva a entrar a `/login` o `/register`.
 * 2. Protege `/mi-panel` y `/onboarding-trabajador` para que solo accedan usuarios con rol `walker` o `caregiver`.
 * 3. Protege `/mi-perfil` para que solo accedan usuarios autenticados.
 */
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  // Si ya inició sesión e intenta ir a login o registro, lo redirigimos a su vista principal según su rol
  if ((to.name === 'login' || to.name === 'register') && token && user) {
    next(user.role === 'client' ? '/paseadores' : '/mi-panel')
    return
  }

  // Protección del panel de trabajador: requiere token y rol 'walker' o 'caregiver'
  if (to.name === 'worker-dashboard' && (!token || !user || !['walker', 'caregiver'].includes(user.role))) {
    next('/login')
    return
  }

  // Protección del onboarding de trabajador: si no es trabajador autenticado, lo envía al registro de trabajadores
  if (to.name === 'onboarding-worker' && (!token || !user || !['walker', 'caregiver'].includes(user.role))) {
    next('/trabaja-con-nosotros')
    return
  }

  // Proteger la vista de cliente para que solo accedan usuarios logueados
  if (to.name === 'client-profile' && (!token || !user)) {
    next('/login')
    return
  }

  // Si pasa todas las validaciones, permitimos continuar la navegación
  next()
})

export default router
