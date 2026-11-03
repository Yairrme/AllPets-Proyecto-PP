<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import loginPetsImg from '../assets/login-pets.jpg'

// router para redirigir después del login
const router = useRouter()
const route = useRoute()
// authStore contiene la lógica para comunicarse con el backend
const authStore = useAuthStore()

// Variables reactivas para el formulario
const email = ref('')
const password = ref('')
const errorMsg = ref(route.query.expired ? 'Tu sesión venció. Volvé a iniciar sesión.' : '')
const isLoading = ref(false)

// Función principal que se ejecuta al enviar el formulario
const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    // Llama a la acción login del store de Pinia, que hace el POST al API Gateway
    await authStore.login(email.value, password.value)
    
    // Cada rol entra directo a su área
    const role = authStore.user?.role
    if (role === 'walker' || role === 'caregiver') {
      router.push({ name: 'worker-dashboard' })
    } else if (role === 'admin') {
      router.push({ name: 'admin' })
    } else {
      // Vuelve a donde estaba (ej. tocó "Contactar"). Solo rutas internas de la app.
      const redirect = route.query.redirect
      const isInternal =
        typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      router.push(isInternal ? redirect : { name: 'home' })
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
  <div class="min-h-screen flex flex-col items-center justify-center bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200/80 overflow-hidden">
      <!-- Imagen de mascotas en la parte superior del card -->
      <div class="w-full bg-[#f6f6f6] flex justify-center border-b border-stone-100 overflow-hidden select-none">
        <img
          :src="loginPetsImg"
          alt="Mascotas AllPets"
          class="w-full h-44 sm:h-48 object-cover object-[center_35%] transition-transform hover:scale-105 duration-500"
        />
      </div>

      <!-- Contenido del Card Iniciar Sesión -->
      <div class="p-8 space-y-6">
        <div>
          <!-- Ajuste de color a text-stone-900 para mejor contraste y legibilidad -->
          <h2 class="text-center text-3xl font-extrabold text-stone-900 tracking-tight">
            Iniciar sesión
          </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <!-- Enlace de registro resaltado en azul índigo -->
          <RouterLink to="/register" class="font-semibold text-(--header-accent) hover:text-(--header-text) transition-colors">
            registrate si no tenés cuenta
          </RouterLink>
        </p>
      </div>
      
      <!-- Evento submit conectado al método handleLogin con preventDefault -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md space-y-5">
          <!-- Campo Correo -->
          <div>
            <label for="email-address" class="block text-sm font-semibold text-gray-800 mb-1">Correo electrónico</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--brand) focus:border-(--brand) sm:text-sm transition-shadow"
              placeholder="correo@ejemplo.com" />
          </div>
          <!-- Campo Contraseña -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-800 mb-1">Contraseña</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required v-model="password"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--brand) focus:border-(--brand) sm:text-sm transition-shadow"
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
            class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-(--brand) hover:bg-(--brand-dark) focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--brand) disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            {{ isLoading ? 'Iniciando...' : 'Entrar' }}
          </button>
        </div>

        <div class="text-center pt-2">
          <RouterLink to="/paseadores" class="text-sm font-medium text-gray-500 hover:text-(--header-text) transition-colors">
            ← Continuar como invitado y ver paseadores
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</div>
</template>
