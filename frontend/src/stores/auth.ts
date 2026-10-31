/**
 * ============================================================================
 * ARCHIVO: stores/auth.ts
 * ROL EN LA ARQUITECTURA: Store de Pinia para Autenticación y Gestión de Sesión.
 * ============================================================================
 * Descripción general:
 * Centraliza todo el flujo de autenticación del usuario frente al API Gateway
 * (`http://localhost:3000`). Administra el estado reactivo del usuario logueado
 * y su token JWT, sincronizándolos con `localStorage` y con las cabeceras
 * por defecto de Axios para mantener la sesión activa entre recargas de página.
 */

import { defineStore } from 'pinia'
import axios from 'axios'

// URL base del API Gateway (punto único de entrada al backend de microservicios)
const API_URL = 'http://localhost:3000'

/**
 * Función auxiliar para extraer un mensaje de error claro desde la respuesta
 * de NestJS / Axios. Si `message` es un arreglo de validaciones (class-validator),
 * los une con comas; de lo contrario, retorna el texto o un mensaje por defecto.
 */
function getApiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export const useAuthStore = defineStore('auth', {
  // ESTADO REACTIVO (State):
  // Almacena el objeto del usuario actual y el token JWT recuperado de localStorage al iniciar
  state: () => ({
    user: null as any | null,
    token: localStorage.getItem('token') || null,
  }),

  // PROPIEDADES COMPUTADAS DEL STORE (Getters):
  getters: {
    // Devuelve `true` si existe un token JWT activo en el estado
    isAuthenticated: (state) => !!state.token,
  },

  // ACCIONES (Actions): Métodos síncronos y asíncronos que modifican el estado o llaman al backend
  actions: {
    /**
     * Envía las credenciales al endpoint `POST /auth/login` del API Gateway.
     * Si son válidas, guarda el `access_token` y los datos del usuario tanto en Pinia
     * como en `localStorage`, y configura la cabecera `Authorization` en Axios.
     */
    async login(email: string, password: string) {
      try {
        // Petición HTTP POST al API Gateway -> redirigida por TCP al microservicio de usuarios/auth
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        })
        
        const data = response.data
        
        // Actualizamos estado reactivo, cabeceras globales de Axios y persistencia en navegador
        this.token = data.access_token
        this.user = data.user
        axios.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        return data
      } catch (error: any) {
        throw new Error(getApiErrorMessage(error, 'Error al iniciar sesión'))
      }
    },

    /**
     * Registra un nuevo usuario (`client`, `walker` o `caregiver`) enviando sus datos
     * al endpoint `POST /auth/register` del API Gateway.
     */
    async register(name: string, email: string, password: string, city: string, phone: string, role: string) {
      try {
        // Petición HTTP POST al API Gateway para crear la cuenta en la base de datos
        const response = await axios.post(`${API_URL}/auth/register`, {
          name,
          email,
          password,
          city,
          role,
          // Solo incluimos el teléfono en el payload si el usuario escribió un valor no vacío
          ...(phone.trim() ? { phone: phone.trim() } : {})
        })
        
        return response.data
      } catch (error: any) {
        throw new Error(getApiErrorMessage(error, 'Error al registrarse'))
      }
    },

    /**
     * Cierra la sesión actual: limpia el estado de Pinia, elimina la cabecera
     * `Authorization` de Axios y borra los datos persistidos en `localStorage`.
     */
    logout() {
      this.token = null
      this.user = null
      delete axios.defaults.headers.common.Authorization
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    /**
     * Rehidrata el objeto `user` desde `localStorage` cuando se recarga el navegador.
     * Si el JSON guardado estuviera corrupto, fuerza el cierre de sesión por seguridad.
     */
    loadUserFromStorage() {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser)
        } catch (e) {
          this.logout()
        }
      }
    }
  },
})
