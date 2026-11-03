<script setup lang="ts">
import { ref } from 'vue'
import { toApiUrl } from '../../config'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'

const authStore = useAuthStore()
const profileStore = useProfileStore()

const isUploadingGallery = ref(false)
const galleryFiles = ref<File[]>([])
const galleryPreviewUrls = ref<string[]>([])

// Rutas /uploads del backend a URL absoluta (vacío si no hay foto)
const getImageUrl = (path: string) => (path ? toApiUrl(path) : '')

const handleGalleryFiles = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    galleryFiles.value = files
    
    // Generar previews
    galleryPreviewUrls.value = files.map(f => URL.createObjectURL(f))
  }
}

const galleryError = ref('')

const uploadGallery = async () => {
  if (galleryFiles.value.length === 0) return

  isUploadingGallery.value = true
  galleryError.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.uploadGalleryImages(userId, galleryFiles.value)

    // Limpiar form
    galleryFiles.value = []
    galleryPreviewUrls.value = []
  } catch (error: any) {
    galleryError.value = error.message || 'No pudimos subir las fotos.'
  } finally {
    isUploadingGallery.value = false
  }
}

const removeGalleryImage = async (imageUrl: string) => {
  galleryError.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.removeGalleryImage(userId, imageUrl)
  } catch (error: any) {
    galleryError.value = error.message || 'No pudimos eliminar la foto.'
  }
}
</script>

<template>
  <div>
    <div class="mb-8 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <h4 class="text-lg font-medium text-gray-900 mb-2">Añadir nuevas fotos a tu galería</h4>
      <p class="text-sm text-gray-600 mb-4">Subí fotos de los paseos o de las mascotas que cuidaste para generar más confianza en tus clientes.</p>
      
      <p v-if="galleryError" class="mb-3 text-sm text-red-600">{{ galleryError }}</p>
      <div class="flex items-center gap-4">
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" @change="handleGalleryFiles" class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-(--brand-cream) file:text-(--header-accent) hover:file:bg-(--brand-cream)"/>
        <button v-if="galleryFiles.length > 0" @click="uploadGallery" :disabled="isUploadingGallery" class="px-4 py-2 bg-(--brand) text-white rounded-lg hover:bg-(--brand-dark) font-medium whitespace-nowrap transition-colors disabled:opacity-50">
          {{ isUploadingGallery ? 'Subiendo...' : 'Subir fotos' }}
        </button>
      </div>

      <!-- Previews -->
      <div v-if="galleryPreviewUrls.length > 0" class="mt-4 grid grid-cols-4 gap-4">
        <div v-for="(url, idx) in galleryPreviewUrls" :key="idx" class="h-24 rounded-lg overflow-hidden border">
          <img :src="url" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>

    <h4 class="text-xl font-bold text-gray-900 mb-4">Tus fotos publicadas</h4>
    <div v-if="profileStore.caregiverProfile?.gallery_images?.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="(img, idx) in profileStore.caregiverProfile.gallery_images" :key="idx" class="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
        <img :src="getImageUrl(img)" :alt="`Foto ${Number(idx) + 1} de tu galería`" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <button
          type="button"
          @click="removeGalleryImage(img)"
          class="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold w-7 h-7 rounded-full shadow flex items-center justify-center"
          title="Eliminar foto"
          :aria-label="`Eliminar foto ${Number(idx) + 1}`"
        >
          ✕
        </button>
      </div>
    </div>
    <div v-else class="text-center py-12 text-gray-500 border border-dashed rounded-xl">
      Todavía no tenés fotos en tu galería.
    </div>
  </div>
</template>
