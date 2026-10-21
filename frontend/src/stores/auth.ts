import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3000'

function getApiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any | null,
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(email: string, password: string) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        })
        
        const data = response.data
        
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
    async register(name: string, email: string, password: string, city: string, phone: string, role: string) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          name,
          email,
          password,
          city,
          role,
          ...(phone.trim() ? { phone: phone.trim() } : {})
        })
        
        return response.data
      } catch (error: any) {
        throw new Error(getApiErrorMessage(error, 'Error al registrarse'))
      }
    },
    logout() {
      this.token = null
      this.user = null
      delete axios.defaults.headers.common.Authorization
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
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
