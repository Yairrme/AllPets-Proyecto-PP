<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

const authStore = useAuthStore()
const profileStore = useProfileStore()

const API_URL = 'http://localhost:3000' // Para cargar imágenes

const activeTab = ref('perfil')
const isLoading = ref(true)
const isUploadingGallery = ref(false)
const galleryFiles = ref<File[]>([])
const galleryPreviewUrls = ref<string[]>([])

const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

const getReviewerLabel = (review: any) => {
  if (review.reviewer_id?.name) return review.reviewer_id.name
  const reviewerId = review.reviewer_id?._id || review.reviewer_id
  return `Cliente #${String(reviewerId).substring(0, 6)}`
}

onMounted(async () => {
  if (authStore.user) {
    try {
      const userId = authStore.user._id || authStore.user.id
      await profileStore.fetchCaregiverProfile(userId)
      await profileStore.fetchReviews(userId)
    } catch (e) {
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }
})

const handleGalleryFiles = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    galleryFiles.value = files
    
    // Generar previews
    galleryPreviewUrls.value = files.map(f => URL.createObjectURL(f))
  }
}

const uploadGallery = async () => {
  if (galleryFiles.value.length === 0) return
  
  isUploadingGallery.value = true
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.uploadGalleryImages(userId, galleryFiles.value)
    
    // Limpiar form
    galleryFiles.value = []
    galleryPreviewUrls.value = []
  } catch (error) {
    console.error("Error al subir a galería", error)
  } finally {
    isUploadingGallery.value = false
  }
}

const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const editFormData = ref({
  bio: '',
  services: '' as string | string[],
  availability: '' as string | string[],
  phone: '',
})

const startEditing = () => {
  const profile = profileStore.caregiverProfile
  if (profile) {
    editFormData.value = {
      bio: profile.bio || '',
      services: Array.isArray(profile.services) ? profile.services.join(', ') : '',
      availability: Array.isArray(profile.availability) ? profile.availability.join(', ') : '',
      phone: authStore.user?.phone || '',
    }
  }
  isEditingProfile.value = true
}

const saveProfile = async () => {
  isSavingProfile.value = true
  try {
    const userId = authStore.user._id || authStore.user.id
    
    // Formatear arrays
    const formattedData = {
      bio: editFormData.value.bio,
      services: typeof editFormData.value.services === 'string' 
        ? editFormData.value.services.split(',').map(s => s.trim()).filter(s => s) 
        : editFormData.value.services,
      availability: typeof editFormData.value.availability === 'string'
        ? editFormData.value.availability.split(',').map(s => s.trim()).filter(s => s)
        : editFormData.value.availability,
    }
    
    await profileStore.updateCaregiverProfile(userId, formattedData)

    if (authStore.user) {
      authStore.user.phone = editFormData.value.phone
    }

    isEditingProfile.value = false
  } catch (error) {
    console.error("Error al guardar perfil", error)
  } finally {
    isSavingProfile.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-12">
    <!-- Header del Dashboard -->
    <div class="bg-indigo-700 pb-24">
      <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-white">Mi Panel de Trabajador</h1>
        <p class="mt-2 text-indigo-100">Gestiona tu perfil, fotos y visualiza tus reseñas.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      
      <!-- Navegación por pestañas -->
      <div class="bg-white rounded-t-xl border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button @click="activeTab = 'perfil'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'perfil' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
            Mi Perfil
          </button>
          <button @click="activeTab = 'galeria'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'galeria' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
            Mi Galería de Fotos
          </button>
          <button @click="activeTab = 'resenas'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'resenas' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
            Mis Reseñas
          </button>
        </nav>
      </div>

      <div class="bg-white shadow rounded-b-xl min-h-[400px]">
        <div v-if="isLoading" class="flex justify-center items-center h-64 text-gray-400">
          Cargando datos...
        </div>

        <div v-else class="p-6 sm:p-8">
          
          <!-- TAB PERFIL -->
          <div v-if="activeTab === 'perfil'">
            <div class="flex flex-col md:flex-row gap-8 relative">
              
              <!-- Botón de Editar -->
              <div class="absolute top-0 right-0">
                <button v-if="!isEditingProfile" @click="startEditing" class="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                  Editar Perfil
                </button>
              </div>

              <div class="flex-shrink-0 flex flex-col items-center text-center">
                <div class="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                  <img v-if="profileStore.caregiverProfile?.profile_image" :src="getImageUrl(profileStore.caregiverProfile.profile_image)" class="w-full h-full object-cover"/>
                  <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400">👤</div>
                </div>
                <h3 class="text-xl font-bold text-gray-900">{{ authStore.user?.name }}</h3>
                <p class="text-sm text-gray-500 capitalize">{{ authStore.user?.role }}</p>
                <div class="mt-2 flex items-center justify-center text-amber-500">
                  ★ <span class="ml-1 text-gray-700 font-bold">{{ profileStore.caregiverProfile?.rating_avg?.toFixed(1) || '0.0' }}</span>
                </div>
                <div class="mt-3 text-sm text-gray-700">
                  <span class="font-semibold">Teléfono:</span> {{ authStore.user?.phone || 'Sin teléfono cargado' }}
                </div>
              </div>
              
              <!-- Vista de Perfil -->
              <div v-if="!isEditingProfile" class="flex-1 space-y-6 pt-10 md:pt-0">
                <div>
                  <h4 class="text-lg font-semibold border-b pb-2 mb-3">Biografía y Experiencia</h4>
                  <p class="text-gray-700 whitespace-pre-line">{{ profileStore.caregiverProfile?.bio || 'No has añadido una biografía todavía.' }}</p>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 class="text-lg font-semibold border-b pb-2 mb-3">Servicios Ofrecidos</h4>
                    <ul class="list-disc list-inside text-gray-700">
                      <li v-for="s in profileStore.caregiverProfile?.services" :key="s">{{ s }}</li>
                      <li v-if="!profileStore.caregiverProfile?.services?.length" class="text-gray-400 list-none">Ninguno configurado</li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-lg font-semibold border-b pb-2 mb-3">Disponibilidad</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span v-for="d in profileStore.caregiverProfile?.availability" :key="d" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ d }}
                      </span>
                      <span v-if="!profileStore.caregiverProfile?.availability?.length" class="text-gray-400">No especificada</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Formulario de Edición -->
              <div v-else class="flex-1 space-y-6 pt-10 md:pt-0">
                <form @submit.prevent="saveProfile" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                    <textarea v-model="editFormData.bio" rows="4" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Cuéntanos sobre ti y tu experiencia..."></textarea>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Servicios Ofrecidos (separados por coma)</label>
                    <input v-model="editFormData.services" type="text" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Ej: Paseos individuales, Guardería, Entrenamiento básico" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Disponibilidad (separados por coma)</label>
                    <input v-model="editFormData.availability" type="text" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Ej: Lunes, Martes, Fines de semana" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto</label>
                    <input v-model="editFormData.phone" type="tel" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="299 123-4567" />
                  </div>

                  <div class="flex justify-end gap-3 pt-4">
                    <button type="button" @click="isEditingProfile = false" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                      Cancelar
                    </button>
                    <button type="submit" :disabled="isSavingProfile" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50">
                      {{ isSavingProfile ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          <!-- TAB GALERIA -->
          <div v-if="activeTab === 'galeria'">
            <div class="mb-8 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <h4 class="text-lg font-medium text-gray-900 mb-2">Añadir nuevas fotos a tu galería</h4>
              <p class="text-sm text-gray-500 mb-4">Sube fotos de los paseos o mascotas que has cuidado para generar más confianza en tus clientes.</p>
              
              <div class="flex items-center gap-4">
                <input type="file" multiple accept="image/*" @change="handleGalleryFiles" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                <button v-if="galleryFiles.length > 0" @click="uploadGallery" :disabled="isUploadingGallery" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium whitespace-nowrap transition-colors disabled:opacity-50">
                  {{ isUploadingGallery ? 'Subiendo...' : 'Subir Fotos' }}
                </button>
              </div>

              <!-- Previews -->
              <div v-if="galleryPreviewUrls.length > 0" class="mt-4 grid grid-cols-4 gap-4">
                <div v-for="(url, idx) in galleryPreviewUrls" :key="idx" class="h-24 rounded-lg overflow-hidden border">
                  <img :src="url" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <h4 class="text-xl font-bold text-gray-900 mb-4">Tus Fotos Publicadas</h4>
            <div v-if="profileStore.caregiverProfile?.gallery_images?.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="(img, idx) in profileStore.caregiverProfile.gallery_images" :key="idx" class="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
                <img :src="getImageUrl(img)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
            <div v-else class="text-center py-12 text-gray-400 border border-dashed rounded-xl">
              No tienes fotos en tu galería todavía.
            </div>
          </div>

          <!-- TAB RESEÑAS -->
          <div v-if="activeTab === 'resenas'">
            <h4 class="text-xl font-bold text-gray-900 mb-6">Reseñas de Clientes</h4>
            
            <div v-if="profileStore.reviews.length > 0" class="space-y-6">
              <div v-for="review in profileStore.reviews" :key="review._id" class="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-900">{{ getReviewerLabel(review) }}</span>
                    <span class="text-xs text-gray-500">• {{ new Date(review.created_at).toLocaleDateString() }}</span>
                  </div>
                  <div class="text-amber-500 font-bold tracking-widest">
                    {{ '★'.repeat(review.score) }}{{ '☆'.repeat(5 - review.score) }}
                  </div>
                </div>
                <p class="text-gray-700">{{ review.comment }}</p>
              </div>
            </div>
            
            <div v-else class="text-center py-12 text-gray-400 border border-dashed rounded-xl">
              Aún no tienes reseñas. ¡Empieza a realizar paseos para recibirlas!
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
