<!--
  ============================================================================
  ARCHIVO: views/ClientProfileView.vue
  ROL EN LA ARQUITECTURA: Vista de Gestión de Perfil Personal del Cliente.
  ============================================================================
  Descripción general:
  Permite al usuario con rol `'client'` consultar y editar su información personal
  (nombre, correo, ciudad y teléfono) así como actualizar su fotografía de perfil.
  Sincroniza los cambios tanto con el backend (a través de `useProfileStore`) como
  con la sesión activa en `useAuthStore` y `localStorage`.
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

// Stores de Pinia para leer/actualizar la sesión actual y ejecutar peticiones al API Gateway
const authStore = useAuthStore()
const profileStore = useProfileStore()
const API_URL = 'http://localhost:3000'

// Estados reactivos de control de interfaz (subida de foto, modo edición, guardado y alertas)
const isUploadingImage = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// Objeto reactivo que respalda los inputs del formulario cuando `isEditing` es `true`
const editForm = ref({
  name: '',
  email: '',
  city: 'Cipolletti',
  phone: '',
})

/**
 * Al montar el componente:
 * 1. Carga el usuario desde `localStorage`.
 * 2. Consulta al backend (`GET /users/:id`) para obtener los datos más recientes y sincronizarlos.
 */
onMounted(async () => {
  authStore.loadUserFromStorage()
  const userId = authStore.user?._id || authStore.user?.id
  if (userId) {
    try {
      const freshUser = await profileStore.fetchUserById(userId)
      authStore.user = { ...authStore.user, ...freshUser }
      localStorage.setItem('user', JSON.stringify(authStore.user))
    } catch (e) {
      console.error(e)
    }
  }
})

/**
 * Construye la URL absoluta de la imagen de perfil para mostrarla en el elemento `<img>`.
 */
const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

/**
 * Activa el modo de edición copiando los datos actuales del usuario hacia `editForm`.
 */
const startEditing = () => {
  successMsg.value = ''
  errorMsg.value = ''
  editForm.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    city: authStore.user?.city || 'Cipolletti',
    phone: authStore.user?.phone || '',
  }
  isEditing.value = true
}

/**
 * Cancela la edición y vuelve a la vista de solo lectura sin guardar cambios.
 */
const cancelEditing = () => {
  errorMsg.value = ''
  isEditing.value = false
}

/**
 * Envía los datos editados al API Gateway (`PUT /users/:id`) a través de `profileStore.updateClientProfile`
 * y actualiza la sesión local en `authStore` y `localStorage`.
 */
const handleSaveProfile = async () => {
  if (!authStore.user) return
  isSaving.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    const updatedUser = await profileStore.updateClientProfile(userId, {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
      city: editForm.value.city,
      phone: editForm.value.phone.trim(),
    })

    authStore.user = {
      ...authStore.user,
      ...updatedUser,
    }
    localStorage.setItem('user', JSON.stringify(authStore.user))
    isEditing.value = false
    successMsg.value = 'Tus datos personales fueron actualizados correctamente.'
  } catch (error: any) {
    errorMsg.value = error.message || 'Error al guardar los cambios del perfil.'
  } finally {
    isSaving.value = false
  }
}

/**
 * Se dispara al seleccionar un archivo en el `<input type="file">`.
 * Sube la nueva foto de perfil al servidor (`POST /users/:id/image`) y actualiza el avatar en el navbar.
 */
const handleProfileImageChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    isUploadingImage.value = true
    errorMsg.value = ''
    successMsg.value = ''
    try {
      const userId = authStore.user._id || authStore.user.id
      const updatedUser = await profileStore.uploadClientProfileImage(userId, file)
      
      // Actualizamos la sesión local con la nueva imagen
      if (authStore.user) {
        authStore.user.profile_image = updatedUser.profile_image
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }
      successMsg.value = 'Foto de perfil actualizada correctamente.'
    } catch (error: any) {
      console.error("Error al subir foto de perfil", error)
      errorMsg.value = error.message || 'Error al subir la foto de perfil'
    } finally {
      isUploadingImage.value = false
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 pb-12">
    <!-- Header -->
    <div class="bg-indigo-700 pb-24">
      <div class="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-white">Mi Perfil (Cliente)</h1>
        <p class="mt-2 text-indigo-100">Gestiona tu foto de perfil y tu información personal.</p>
      </div>
    </div>

    <!-- Tarjeta principal superpuesta sobre el banner superior (-mt-16) -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      <div class="bg-white text-gray-900 shadow rounded-xl p-6 sm:p-10">

        <!-- Mensajes de retroalimentación (éxito o error) -->
        <div v-if="successMsg" class="mb-6 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          ✓ {{ successMsg }}
        </div>
        <div v-if="errorMsg" class="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {{ errorMsg }}
        </div>
        
        <div class="flex flex-col md:flex-row gap-8 items-start">
          
          <!-- Avatar y Subida -->
          <div class="flex-shrink-0 flex flex-col items-center">
            <div class="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
              <img 
                v-if="authStore.user?.profile_image" 
                :src="getImageUrl(authStore.user.profile_image)" 
                class="w-full h-full object-cover"
                alt="Foto de perfil"
              />
              <span v-else>👤</span>
            </div>
            
            <div class="w-full text-center relative overflow-hidden">
              <label class="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors w-full">
                <span>{{ isUploadingImage ? 'Subiendo...' : 'Cambiar foto' }}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleProfileImageChange" 
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  :disabled="isUploadingImage"
                />
              </label>
            </div>
          </div>

          <!-- Información del cliente (Vista de solo lectura) -->
          <div v-if="!isEditing" class="flex-1 w-full space-y-6">
            <div>
              <div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                <h3 class="text-lg font-bold text-gray-900">Información Personal</h3>
                <button
                  type="button"
                  @click="startEditing"
                  class="px-4 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Editar Perfil
                </button>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-600">Nombre completo</label>
                  <div class="mt-1 text-gray-900 font-medium">{{ authStore.user?.name }}</div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-600">Correo Electrónico</label>
                  <div class="mt-1 text-gray-900">{{ authStore.user?.email }}</div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-600">Ciudad</label>
                  <div class="mt-1 text-gray-900">{{ authStore.user?.city || 'No especificada' }}</div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-600">Teléfono</label>
                  <div class="mt-1 text-gray-900">{{ authStore.user?.phone || 'No especificado' }}</div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-600">Rol en el sistema</label>
                  <div class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wide">
                    {{ authStore.user?.role }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Formulario de Edición del Cliente (activo cuando isEditing === true) -->
          <div v-else class="flex-1 w-full">
            <div class="border-b border-gray-200 pb-2 mb-4">
              <h3 class="text-lg font-bold text-gray-900">Editar Información Personal</h3>
            </div>

            <form @submit.prevent="handleSaveProfile" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-800 mb-1">Nombre completo</label>
                  <input
                    v-model="editForm.name"
                    type="text"
                    required
                    minlength="2"
                    class="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-800 mb-1">Correo Electrónico</label>
                  <input
                    v-model="editForm.email"
                    type="email"
                    required
                    class="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-800 mb-1">Ciudad</label>
                  <select
                    v-model="editForm.city"
                    required
                    class="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="Cipolletti">Cipolletti</option>
                    <option value="Neuquén">Neuquén</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-800 mb-1">Teléfono</label>
                  <input
                    v-model="editForm.phone"
                    type="tel"
                    class="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="299 123-4567"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  @click="cancelEditing"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isSaving"
                  class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>
