import axios from 'axios'
import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * Token vencido o cuenta eliminada: cierra la sesión en vez de seguir fallando.
 * El login también responde 401 con credenciales incorrectas: ese error es del formulario.
 */
export function setupSessionInterceptor(router: Router) {
  const authStore = useAuthStore()
  return axios.interceptors.response.use(undefined, (error) => {
    const isLogin = String(error.config?.url ?? '').endsWith('/auth/login')
    if (error.response?.status === 401 && !isLogin && authStore.token) {
      authStore.logout()
      router.push({ name: 'login', query: { expired: '1' } })
    }
    return Promise.reject(error)
  })
}
