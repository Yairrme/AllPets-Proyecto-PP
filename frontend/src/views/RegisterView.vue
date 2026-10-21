<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Variables reactivas enlazadas a los inputs del formulario
const name = ref('')
const email = ref('')
const password = ref('')
const city = ref('Cipolletti')
const phone = ref('')

const errorMsg = ref('')
const isLoading = ref(false)

// Función para registrar un nuevo cliente
const handleRegister = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    // Por defecto desde este formulario se registra con el rol 'client'
    // La conexión se realiza a través de Axios en nuestro authStore (Pinia)
    await authStore.register(name.value, email.value, password.value, city.value, phone.value, 'client')
    
    // Una vez completado exitosamente el registro, redirigimos al login
    router.push('/login')
  } catch (error: any) {
    errorMsg.value = error.message || 'Error al registrarse'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Crear una cuenta
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <!-- Mejora de legibilidad con text-indigo-600 y fuente semi-negrita -->
          <RouterLink to="/login" class="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            inicia sesión si ya tienes una
          </RouterLink>
        </p>
      </div>
      
      <!-- Se conecta el formulario con el script usando @submit.prevent -->
      <form class="mt-8 space-y-5" @submit.prevent="handleRegister">
        <div class="rounded-md space-y-4">
          <!-- Campo Nombre -->
          <div>
            <label for="name" class="block text-sm font-semibold text-gray-800 mb-1">Nombre completo</label>
            <input id="name" name="name" type="text" required v-model="name"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow"
              placeholder="Juan Pérez" />
          </div>
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
            <input id="password" name="password" type="password" required v-model="password"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow"
              placeholder="••••••••" />
          </div>
          <!-- Selector de Ciudad -->
          <div>
            <label for="city" class="block text-sm font-semibold text-gray-800 mb-1">Ciudad</label>
            <select id="city" v-model="city" required
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow">
              <option value="Cipolletti">Cipolletti</option>
              <option value="Neuquén">Neuquén</option>
            </select>
          </div>
          <!-- Campo Teléfono -->
          <div>
            <label for="phone" class="block text-sm font-semibold text-gray-800 mb-1">Teléfono</label>
            <input id="phone" name="phone" type="tel" v-model="phone"
              class="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow"
              placeholder="299 123-4567" />
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-700 text-sm font-medium text-center bg-red-100 p-3 rounded-md border border-red-200">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" :disabled="isLoading"
            class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            {{ isLoading ? 'Registrando...' : 'Registrarse' }}
          </button>
        </div>
      </form>

      <!-- Enlace para trabajadores (Paseadores o cuidadores) -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700">
            ¿Quieres ofrecer tus servicios en All Pets?
          </p>
          <RouterLink to="/trabaja-con-nosotros" class="mt-3 inline-flex items-center justify-center px-4 py-2 border-2 border-indigo-600 text-sm font-bold rounded-md text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-700 transition-colors w-full">
            Trabaja con nosotros como Paseador o Cuidador
          </RouterLink>
        </div>
      </div>

    </div>
  </div>
</template>
