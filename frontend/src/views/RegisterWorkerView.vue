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
const role = ref('walker') // Default a paseador
const errorMsg = ref('')
const isLoading = ref(false)

const handleRegisterWorker = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    await authStore.register(name.value, email.value, password.value, city.value, phone.value, role.value)
    await authStore.login(email.value, password.value)
    router.push('/onboarding-trabajador')
  } catch (error: any) {
    errorMsg.value = error.message || 'Error al registrarse'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-lg w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div>
        <div class="flex justify-center">
          <span class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
            <!-- Icono simple de maletín o profesional -->
            <svg class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Únete a All Pets
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ofrece tus servicios de manera profesional como paseador o cuidador.
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegisterWorker">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input id="name" name="name" type="text" required v-model="name"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Ej. María Gómez" />
          </div>
          <div>
            <label for="email-address" class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="tu@correo.com" />
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
            <input id="phone" name="phone" type="tel" required v-model="phone"
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="299 123-4567" />
          </div>
          
          <div class="pt-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">¿Qué servicio deseas ofrecer?</label>
            <div class="grid grid-cols-2 gap-4">
              <label class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none" 
                     :class="role === 'walker' ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-300'">
                <input type="radio" name="service-type" value="walker" v-model="role" class="sr-only">
                <div class="flex flex-col">
                  <span class="block text-sm font-medium" :class="role === 'walker' ? 'text-indigo-900' : 'text-gray-900'">Paseador</span>
                  <span class="mt-1 block text-xs text-gray-500">Paseos diarios y cuidado en exteriores.</span>
                </div>
              </label>

              <label class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
                     :class="role === 'caregiver' ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-300'">
                <input type="radio" name="service-type" value="caregiver" v-model="role" class="sr-only">
                <div class="flex flex-col">
                  <span class="block text-sm font-medium" :class="role === 'caregiver' ? 'text-indigo-900' : 'text-gray-900'">Cuidador</span>
                  <span class="mt-1 block text-xs text-gray-500">Alojamiento y guardería para mascotas.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" :disabled="isLoading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
            {{ isLoading ? 'Enviando solicitud...' : 'Comenzar a trabajar' }}
          </button>
        </div>
      </form>
      
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          ¿Buscabas crear una cuenta para tu mascota?
          <RouterLink to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
            Volver
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
