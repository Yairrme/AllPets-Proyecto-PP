<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// router para redirigir después del login
const router = useRouter()
// authStore contiene la lógica para comunicarse con el backend
const authStore = useAuthStore()

// Variables reactivas para el formulario
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

// Función principal que se ejecuta al enviar el formulario
const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    // Llama a la acción login del store de Pinia, que hace el POST al API Gateway
    await authStore.login(email.value, password.value)
    
    // Si la autenticación es exitosa, verificamos el rol
    // Redirigir al dashboard de prestador si es paseador o cuidador
    if (authStore.user?.role === 'walker' || authStore.user?.role === 'caregiver') {
      router.push('/mi-panel')
    } else {
      // Cliente regular va a la pantalla de paseadores
      router.push('/paseadores')
    }
  } catch (error: any) {
    // Mostramos el mensaje de error que devuelve el backend (ej. credenciales inválidas)
    errorMsg.value = error.message || 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <div>
        <!-- Ajuste de color a text-gray-900 para mejor contraste y legibilidad -->
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Iniciar Sesión
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <!-- Enlace de registro resaltado en azul índigo -->
          <RouterLink to="/register" class="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            regístrate si no tienes cuenta
          </RouterLink>
        </p>
      </div>
      
      <!-- Evento submit conectado al método handleLogin con preventDefault -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md space-y-5">
          <!-- Campo Correo -->
          <div>
            <label for="email-address" class="block text-sm font-semibold text-gray-800 mb-1">Correo Electrónico</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow"
              placeholder="correo@ejemplo.com" />
          </div>
          <!-- Campo Contraseña -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-800 mb-1">Contraseña</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required v-model="password"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow"
              placeholder="••••••••" />
          </div>
        </div>

        <!-- Renderizado condicional del mensaje de error (letras rojas intensas y fondo suave) -->
        <div v-if="errorMsg" class="text-red-700 text-sm font-medium text-center bg-red-100 p-3 rounded-md border border-red-200">
          {{ errorMsg }}
        </div>

        <div>
          <!-- Botón de estado dinámico (Iniciando...) -->
          <button type="submit" :disabled="isLoading"
            class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            {{ isLoading ? 'Iniciando...' : 'Entrar' }}
          </button>
        </div>

        <div class="text-center pt-2">
          <RouterLink to="/paseadores" class="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
            ← Continuar como invitado y ver paseadores
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
