<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const API_URL = 'http://localhost:3000'

const isUploadingImage = ref(false)

const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

const handleProfileImageChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    isUploadingImage.value = true
    try {
      const userId = authStore.user._id || authStore.user.id
      const updatedUser = await profileStore.uploadClientProfileImage(userId, file)
      
      // Actualizamos la sesión local con la nueva imagen
      if (authStore.user) {
        authStore.user.profile_image = updatedUser.profile_image
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }
    } catch (error) {
      console.error("Error al subir foto de perfil", error)
      alert("Error al subir la foto de perfil")
    } finally {
      isUploadingImage.value = false
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-12">
    <!-- Header -->
    <div class="bg-indigo-700 pb-24">
      <div class="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-white">Mi Perfil (Cliente)</h1>
        <p class="mt-2 text-indigo-100">Gestiona tu foto de perfil y tu información personal.</p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      <div class="bg-white shadow rounded-xl p-6 sm:p-10">
        
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

          <!-- Información del cliente -->
          <div class="flex-1 w-full space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Información Personal</h3>
              
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
        </div>

      </div>
    </div>
  </div>
</template>
