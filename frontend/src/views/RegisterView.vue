<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const city = ref('Cipolletti')
const phone = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    await authStore.register(name.value, email.value, password.value, city.value, phone.value, 'client')
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
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crear una cuenta
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <RouterLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            inicia sesión si ya tienes una
          </RouterLink>
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input id="name" name="name" type="text" required v-model="name"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Juan Pérez" />
          </div>
          <div>
            <label for="email-address" class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
            <input id="password" name="password" type="password" required v-model="password"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="••••••••" />
          </div>
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700">Ciudad</label>
            <select id="city" v-model="city" required
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm">
              <option value="Cipolletti">Cipolletti</option>
              <option value="Neuquén">Neuquén</option>
            </select>
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">Teléfono</label>
            <input id="phone" name="phone" type="tel" v-model="phone"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="299 123-4567" />
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
            {{ isLoading ? 'Registrando...' : 'Registrarse' }}
          </button>
        </div>
      </form>

      <!-- Enlace para trabajadores -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="text-center">
          <p class="text-sm text-gray-600">
            ¿Quieres ofrecer tus servicios en All Pets?
          </p>
          <RouterLink to="/trabaja-con-nosotros" class="mt-2 inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors w-full">
            Trabaja con nosotros como Paseador o Cuidador
          </RouterLink>
        </div>
      </div>

    </div>
  </div>
</template>
