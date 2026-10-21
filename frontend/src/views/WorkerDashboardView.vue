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
  authStore.loadUserFromStorage()
  if (authStore.user) {
    try {
      const userId = authStore.user._id || authStore.user.id
      const [freshUser] = await Promise.all([
        profileStore.fetchUserById(userId).catch(() => null),
        profileStore.fetchCaregiverProfile(userId),
        profileStore.fetchReviews(userId),
      ])
      if (freshUser) {
        authStore.user = { ...authStore.user, ...freshUser }
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }
    } catch (e) {
      console.error(e)
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
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
const profileSuccessMsg = ref('')
const profileErrorMsg = ref('')
const allPetSizes = ['pequeño', 'mediano', 'grande']
const presetCertifications = [
  'Permiso Municipal Vigente',
  'Registro Municipal de Paseadores',
  'Primeros Auxilios Veterinarios',
  'Adiestramiento Canino',
  'Seguro de Responsabilidad Civil',
]

const newCustomCertification = ref('')
const isSavingCertifications = ref(false)
const isUploadingCertDocs = ref(false)
const certDocFiles = ref<File[]>([])
const certDocPreviewUrls = ref<string[]>([])

const editFormData = ref({
  name: '',
  city: 'Cipolletti',
  bio: '',
  services: '' as string | string[],
  availability: '' as string | string[],
  phone: '',
  hourly_rate: 4000,
  experience_years: 1,
  accepted_sizes: ['pequeño', 'mediano', 'grande'] as string[],
  certifications: [] as string[],
})

const toggleAcceptedSize = (size: string) => {
  if (editFormData.value.accepted_sizes.includes(size)) {
    editFormData.value.accepted_sizes = editFormData.value.accepted_sizes.filter((s) => s !== size)
  } else {
    editFormData.value.accepted_sizes.push(size)
  }
}

const toggleCertificationInProfile = async (cert: string) => {
  const current: string[] = Array.isArray(profileStore.caregiverProfile?.certifications)
    ? [...profileStore.caregiverProfile.certifications]
    : []
  const updated = current.includes(cert)
    ? current.filter((c) => c !== cert)
    : [...current, cert]
  await persistCertifications(updated)
}

const addCustomCertification = async () => {
  const val = newCustomCertification.value.trim()
  if (!val) return
  const current: string[] = Array.isArray(profileStore.caregiverProfile?.certifications)
    ? [...profileStore.caregiverProfile.certifications]
    : []
  if (!current.includes(val)) {
    await persistCertifications([...current, val])
  }
  newCustomCertification.value = ''
}

const removeCertification = async (cert: string) => {
  const current: string[] = Array.isArray(profileStore.caregiverProfile?.certifications)
    ? [...profileStore.caregiverProfile.certifications]
    : []
  await persistCertifications(current.filter((c) => c !== cert))
}

const persistCertifications = async (certifications: string[]) => {
  isSavingCertifications.value = true
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.updateCaregiverProfile(userId, { certifications })
  } catch (error) {
    console.error('Error al actualizar certificaciones', error)
  } finally {
    isSavingCertifications.value = false
  }
}

const handleCertDocFiles = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    certDocFiles.value = files
    certDocPreviewUrls.value = files.map((f) => URL.createObjectURL(f))
  }
}

const uploadCertDocs = async () => {
  if (certDocFiles.value.length === 0) return
  isUploadingCertDocs.value = true
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.uploadCertificationDocuments(userId, certDocFiles.value)
    certDocFiles.value = []
    certDocPreviewUrls.value = []
  } catch (error) {
    console.error('Error al subir comprobantes de certificación', error)
  } finally {
    isUploadingCertDocs.value = false
  }
}

const removeCertificationDocument = async (docUrl: string) => {
  const currentDocs: string[] = Array.isArray(profileStore.caregiverProfile?.certification_documents)
    ? [...profileStore.caregiverProfile.certification_documents]
    : []
  const updatedDocs = currentDocs.filter((d) => d !== docUrl)
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.updateCaregiverProfile(userId, { certification_documents: updatedDocs })
  } catch (error) {
    console.error('Error al eliminar comprobante', error)
  }
}

const startEditing = () => {
  profileSuccessMsg.value = ''
  profileErrorMsg.value = ''
  const profile = profileStore.caregiverProfile
  editFormData.value = {
    name: authStore.user?.name || '',
    city: authStore.user?.city || 'Cipolletti',
    bio: profile?.bio || '',
    services: Array.isArray(profile?.services) ? profile.services.join(', ') : '',
    availability: Array.isArray(profile?.availability) ? profile.availability.join(', ') : '',
    phone: authStore.user?.phone || '',
    hourly_rate: Number(profile?.hourly_rate) || 4000,
    experience_years: Number(profile?.experience_years) || 1,
    accepted_sizes:
      Array.isArray(profile?.accepted_sizes) && profile.accepted_sizes.length > 0
        ? [...profile.accepted_sizes]
        : ['pequeño', 'mediano', 'grande'],
    certifications: Array.isArray(profile?.certifications) ? [...profile.certifications] : [],
  }
  isEditingProfile.value = true
}

const saveProfile = async () => {
  isSavingProfile.value = true
  profileSuccessMsg.value = ''
  profileErrorMsg.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    
    // Formatear arrays y campos numéricos + teléfono
    const formattedData = {
      bio: editFormData.value.bio,
      services: typeof editFormData.value.services === 'string' 
        ? editFormData.value.services.split(',').map(s => s.trim()).filter(s => s) 
        : editFormData.value.services,
      availability: typeof editFormData.value.availability === 'string'
        ? editFormData.value.availability.split(',').map(s => s.trim()).filter(s => s)
        : editFormData.value.availability,
      hourly_rate: Number(editFormData.value.hourly_rate) || 4000,
      experience_years: Number(editFormData.value.experience_years) || 1,
      accepted_sizes:
        editFormData.value.accepted_sizes.length > 0
          ? editFormData.value.accepted_sizes
          : ['pequeño', 'mediano', 'grande'],
      certifications: editFormData.value.certifications,
      phone: editFormData.value.phone.trim(),
    }
    
    const [updatedUser] = await Promise.all([
      profileStore.updateClientProfile(userId, {
        name: editFormData.value.name.trim(),
        city: editFormData.value.city,
        phone: editFormData.value.phone.trim(),
      }),
      profileStore.updateCaregiverProfile(userId, formattedData),
    ])

    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        ...updatedUser,
        phone: editFormData.value.phone.trim(),
      }
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }

    isEditingProfile.value = false
    profileSuccessMsg.value = 'Cambios guardados correctamente en tu perfil.'
  } catch (error: any) {
    console.error("Error al guardar perfil", error)
    profileErrorMsg.value = error.message || 'Error al guardar los cambios del perfil.'
  } finally {
    isSavingProfile.value = false
  }
}
const handleProfileImageChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    try {
      const userId = authStore.user._id || authStore.user.id
      await profileStore.uploadProfileImage(userId, file)
      // Actualizamos el authStore también por si acaso se refleja la misma imagen a nivel usuario global
      if (authStore.user) {
        authStore.user.profile_image = profileStore.caregiverProfile.profile_image
      }
    } catch (error) {
      console.error("Error al subir foto de perfil", error)
      alert("Error al subir la foto de perfil")
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 pb-12">
    <!-- Header del Dashboard -->
    <div class="bg-indigo-700 pb-24">
      <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-white">Mi Panel de Trabajador</h1>
        <p class="mt-2 text-indigo-100">Gestiona tu perfil, certificaciones, fotos y visualiza tus reseñas.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      
      <!-- Navegación por pestañas -->
      <div class="bg-white rounded-t-xl border-b border-gray-200 overflow-x-auto">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button @click="activeTab = 'perfil'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'perfil' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Mi Perfil
          </button>
          <button @click="activeTab = 'certificaciones'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'certificaciones' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Certificaciones y Permisos
          </button>
          <button @click="activeTab = 'galeria'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'galeria' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Mi Galería de Fotos
          </button>
          <button @click="activeTab = 'resenas'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'resenas' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Mis Reseñas
          </button>
        </nav>
      </div>

      <div class="bg-white text-gray-900 shadow rounded-b-xl min-h-[400px]">
        <div v-if="isLoading" class="flex justify-center items-center h-64 text-gray-500">
          Cargando datos...
        </div>

        <div v-else class="p-6 sm:p-8">
          
          <!-- TAB PERFIL -->
          <div v-if="activeTab === 'perfil'">
            <div v-if="profileSuccessMsg" class="mb-6 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
              ✓ {{ profileSuccessMsg }}
            </div>
            <div v-if="profileErrorMsg" class="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {{ profileErrorMsg }}
            </div>

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
                <p class="text-sm text-gray-500 capitalize">{{ authStore.user?.role }} • {{ authStore.user?.city || 'Cipolletti' }}</p>
                <div class="mt-2 flex items-center justify-center text-amber-500">
                  ★ <span class="ml-1 text-gray-800 font-bold">{{ profileStore.caregiverProfile?.rating_avg?.toFixed(1) || '0.0' }}</span>
                </div>
                <div class="mt-3 text-sm text-gray-700">
                  <span class="font-semibold text-gray-900">Teléfono:</span> {{ authStore.user?.phone || 'Sin teléfono cargado' }}
                </div>
                <div class="mt-1 text-sm text-gray-700">
                  <span class="font-semibold text-gray-900">Tarifa:</span> ${{ (profileStore.caregiverProfile?.hourly_rate || 4000).toLocaleString() }}/h
                </div>
                <div class="mt-1 text-sm text-gray-700">
                  <span class="font-semibold text-gray-900">Experiencia:</span> {{ profileStore.caregiverProfile?.experience_years || 1 }} {{ (profileStore.caregiverProfile?.experience_years || 1) === 1 ? 'año' : 'años' }}
                </div>
              </div>
              
              <!-- Vista de Perfil -->
              <div v-if="!isEditingProfile" class="flex-1 space-y-6 pt-10 md:pt-0">
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Biografía y Experiencia</h4>
                  <p class="text-gray-700 whitespace-pre-line">{{ profileStore.caregiverProfile?.bio || 'No has añadido una biografía todavía.' }}</p>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Servicios Ofrecidos</h4>
                    <ul class="list-disc list-inside text-gray-700">
                      <li v-for="s in profileStore.caregiverProfile?.services" :key="s">{{ s }}</li>
                      <li v-if="!profileStore.caregiverProfile?.services?.length" class="text-gray-400 list-none">Ninguno configurado</li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Disponibilidad</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span v-for="d in profileStore.caregiverProfile?.availability" :key="d" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ d }}
                      </span>
                      <span v-if="!profileStore.caregiverProfile?.availability?.length" class="text-gray-400">No especificada</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Tamaños de Mascota Aceptados</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span
                        v-for="size in (profileStore.caregiverProfile?.accepted_sizes?.length ? profileStore.caregiverProfile.accepted_sizes : ['pequeño', 'mediano', 'grande'])"
                        :key="size"
                        class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize"
                      >
                        {{ size }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                      <h4 class="text-lg font-semibold text-gray-900">Certificaciones y Permisos</h4>
                      <button type="button" @click="activeTab = 'certificaciones'" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                        Gestionar →
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span
                        v-for="cert in profileStore.caregiverProfile?.certifications"
                        :key="cert"
                        class="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        ✓ {{ cert }}
                      </span>
                      <span v-if="!profileStore.caregiverProfile?.certifications?.length" class="text-gray-400 text-sm">
                        Sin certificaciones ni permisos cargados
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Formulario de Edición -->
              <div v-else class="flex-1 space-y-6 pt-10 md:pt-0">
                <form @submit.prevent="saveProfile" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-900 mb-1">Foto de perfil</label>
                    <input type="file" accept="image/*" @change="handleProfileImageChange" class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 mb-1">Nombre completo</label>
                      <input v-model="editFormData.name" type="text" required minlength="2" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Nombre completo" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-900 mb-1">Ciudad</label>
                      <select v-model="editFormData.city" required class="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                        <option value="Cipolletti">Cipolletti</option>
                        <option value="Neuquén">Neuquén</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-900 mb-1">Biografía</label>
                    <textarea v-model="editFormData.bio" rows="4" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Cuéntanos sobre ti y tu experiencia..."></textarea>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 mb-1">Tarifa por hora ($)</label>
                      <input v-model.number="editFormData.hourly_rate" type="number" min="0" step="100" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="4000" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-900 mb-1">Años de experiencia</label>
                      <input v-model.number="editFormData.experience_years" type="number" min="0" max="50" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="1" />
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-900 mb-1">Servicios Ofrecidos (separados por coma)</label>
                    <input v-model="editFormData.services" type="text" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Ej: Paseos individuales, Guardería, Entrenamiento básico" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-900 mb-1">Disponibilidad (separados por coma)</label>
                    <input v-model="editFormData.availability" type="text" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Ej: Lunes, Martes, Fines de semana" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-900 mb-2">Tamaños de mascota aceptados</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="size in allPetSizes"
                        :key="size"
                        type="button"
                        @click="toggleAcceptedSize(size)"
                        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border capitalize"
                        :class="editFormData.accepted_sizes.includes(size) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                      >
                        {{ size }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-900 mb-1">Teléfono de contacto</label>
                    <input v-model="editFormData.phone" type="tel" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="299 123-4567" />
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

          <!-- TAB CERTIFICACIONES Y PERMISOS MUNICIPALES -->
          <div v-if="activeTab === 'certificaciones'" class="space-y-8">
            <div>
              <h4 class="text-xl font-bold text-gray-900 mb-1">Certificaciones y Permisos Municipales</h4>
              <p class="text-sm text-gray-600">
                Agrega tus habilitaciones municipales (Cipolletti / Neuquén), cursos o certificaciones profesionales para destacar tu perfil y brindar mayor seguridad a los dueños de mascotas.
              </p>
            </div>

            <!-- Selección rápida de permisos y certificaciones frecuentes -->
            <div class="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">
                  Selecciona permisos o certificaciones rápidas:
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="preset in presetCertifications"
                    :key="preset"
                    type="button"
                    :disabled="isSavingCertifications"
                    @click="toggleCertificationInProfile(preset)"
                    class="px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors"
                    :class="profileStore.caregiverProfile?.certifications?.includes(preset)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'"
                  >
                    {{ profileStore.caregiverProfile?.certifications?.includes(preset) ? '✓ ' : '+ ' }}{{ preset }}
                  </button>
                </div>
              </div>

              <!-- Input para agregar permiso municipal o certificado personalizado -->
              <form @submit.prevent="addCustomCertification" class="pt-3 border-t border-gray-200">
                <label class="block text-sm font-semibold text-gray-900 mb-2">
                  Agregar permiso municipal específico o certificación personalizada:
                </label>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input
                    v-model="newCustomCertification"
                    type="text"
                    maxlength="120"
                    class="flex-1 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ej: Permiso Municipal Cipolletti N° 458 / Curso de Etología Canina"
                  />
                  <button
                    type="submit"
                    :disabled="isSavingCertifications || !newCustomCertification.trim()"
                    class="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>

            <!-- Lista de certificaciones activas -->
            <div>
              <h5 class="text-base font-bold text-gray-900 mb-3">Tus certificaciones y permisos activos</h5>
              <div v-if="profileStore.caregiverProfile?.certifications?.length" class="flex flex-wrap gap-2.5">
                <span
                  v-for="cert in profileStore.caregiverProfile.certifications"
                  :key="cert"
                  class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-900 border border-amber-300"
                >
                  <span>🏅 {{ cert }}</span>
                  <button
                    type="button"
                    @click="removeCertification(cert)"
                    class="text-amber-700 hover:text-red-600 font-bold ml-1"
                    title="Quitar certificación"
                  >
                    ✕
                  </button>
                </span>
              </div>
              <p v-else class="text-sm text-gray-500 italic">
                Aún no has agregado certificaciones ni permisos municipales.
              </p>
            </div>

            <!-- Subida de comprobantes / fotos de certificados o carnet municipal -->
            <div class="pt-6 border-t border-gray-200">
              <div class="mb-6 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <h5 class="text-base font-semibold text-gray-900 mb-1">
                  Subir fotos de tus certificados o carnet / permiso municipal
                </h5>
                <p class="text-sm text-gray-600 mb-4">
                  Adjunta imágenes de tus diplomas, certificados o credencial municipal para que los clientes puedan verificarlos en tu perfil público.
                </p>

                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    @change="handleCertDocFiles"
                    class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <button
                    v-if="certDocFiles.length > 0"
                    type="button"
                    @click="uploadCertDocs"
                    :disabled="isUploadingCertDocs"
                    class="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {{ isUploadingCertDocs ? 'Subiendo...' : 'Subir Comprobantes' }}
                  </button>
                </div>

                <div v-if="certDocPreviewUrls.length > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div v-for="(url, idx) in certDocPreviewUrls" :key="idx" class="h-28 rounded-lg overflow-hidden border border-gray-300 bg-white">
                    <img :src="url" class="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <h5 class="text-base font-bold text-gray-900 mb-3">Comprobantes publicados</h5>
              <div
                v-if="profileStore.caregiverProfile?.certification_documents?.length > 0"
                class="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div
                  v-for="(doc, idx) in profileStore.caregiverProfile.certification_documents"
                  :key="idx"
                  class="aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-gray-200 group relative bg-gray-100"
                >
                  <img :src="getImageUrl(doc)" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    @click="removeCertificationDocument(doc)"
                    class="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold w-7 h-7 rounded-full shadow flex items-center justify-center"
                    title="Eliminar comprobante"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div v-else class="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl text-sm">
                No has subido fotos de certificados o permisos municipales todavía.
              </div>
            </div>
          </div>

          <!-- TAB GALERIA -->
          <div v-if="activeTab === 'galeria'">
            <div class="mb-8 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <h4 class="text-lg font-medium text-gray-900 mb-2">Añadir nuevas fotos a tu galería</h4>
              <p class="text-sm text-gray-600 mb-4">Sube fotos de los paseos o mascotas que has cuidado para generar más confianza en tus clientes.</p>
              
              <div class="flex items-center gap-4">
                <input type="file" multiple accept="image/*" @change="handleGalleryFiles" class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
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
            <div v-else class="text-center py-12 text-gray-500 border border-dashed rounded-xl">
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
            
            <div v-else class="text-center py-12 text-gray-500 border border-dashed rounded-xl">
              Aún no tienes reseñas. ¡Empieza a realizar paseos para recibirlas!
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
