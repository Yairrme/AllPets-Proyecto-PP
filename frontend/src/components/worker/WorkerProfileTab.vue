<script setup lang="ts">
import { ref } from 'vue'
import { toApiUrl } from '../../config'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import { formatARS } from '../../utils/currency'
import { COVERAGE_ZONES } from '../../utils/paseador'

defineEmits<{ (e: 'manage-certifications'): void }>()

const authStore = useAuthStore()
const profileStore = useProfileStore()

// Rutas /uploads del backend a URL absoluta (vacío si no hay foto)
const getImageUrl = (path: string) => (path ? toApiUrl(path) : '')

const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const profileSuccessMsg = ref('')
const profileErrorMsg = ref('')
const allPetSizes = ['pequeño', 'mediano', 'grande']

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
      authStore.persistUser()
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
const isUploadingPhoto = ref(false)

const handleProfileImageChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  profileSuccessMsg.value = ''
  profileErrorMsg.value = ''
  isUploadingPhoto.value = true
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.uploadProfileImage(userId, file)
    // Reflejar la nueva foto en la barra superior
    if (authStore.user) {
      authStore.user.profile_image = profileStore.caregiverProfile.profile_image
      authStore.persistUser()
    }
    profileSuccessMsg.value = 'Foto de perfil actualizada.'
  } catch (error: any) {
    profileErrorMsg.value = error.message || 'No pudimos subir la foto de perfil.'
  } finally {
    isUploadingPhoto.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="profileSuccessMsg" class="mb-6 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
      ✓ {{ profileSuccessMsg }}
    </div>
    <div v-if="profileErrorMsg" class="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
      {{ profileErrorMsg }}
    </div>

    <div class="flex flex-col md:flex-row gap-8 relative">
      
      <!-- Botón de Editar -->
      <div class="absolute top-0 right-0">
        <button v-if="!isEditingProfile" @click="startEditing" class="px-4 py-2 bg-(--brand-cream) text-(--header-accent) hover:bg-(--header-hover) rounded-lg text-sm font-medium transition-colors">
          Editar perfil
        </button>
      </div>

      <div class="flex-shrink-0 flex flex-col items-center text-center">
        <label
          class="group relative h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 cursor-pointer"
          title="Cambiar foto de perfil"
        >
          <img v-if="profileStore.caregiverProfile?.profile_image" :src="getImageUrl(profileStore.caregiverProfile.profile_image)" alt="Tu foto de perfil" class="w-full h-full object-cover"/>
          <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400">👤</div>
          <span
            class="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold text-white transition-opacity"
            :class="isUploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          >
            {{ isUploadingPhoto ? 'Subiendo...' : '📷 Cambiar foto' }}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            :disabled="isUploadingPhoto"
            @change="handleProfileImageChange"
          />
        </label>
        <h3 class="text-xl font-bold text-gray-900">{{ authStore.user?.name }}</h3>
        <p class="text-sm text-gray-500 capitalize">{{ authStore.user?.role }} • {{ authStore.user?.city || 'Cipolletti' }}</p>
        <div class="mt-2 flex items-center justify-center text-amber-500">
          ★ <span class="ml-1 text-gray-800 font-bold">{{ profileStore.caregiverProfile?.rating_avg?.toFixed(1) || '0.0' }}</span>
        </div>
        <div class="mt-3 text-sm text-gray-700">
          <span class="font-semibold text-gray-900">Teléfono:</span> {{ authStore.user?.phone || 'Sin teléfono cargado' }}
        </div>
        <div class="mt-1 text-sm text-gray-700">
          <span class="font-semibold text-gray-900">Tarifa:</span> {{ formatARS(profileStore.caregiverProfile?.hourly_rate ?? 4000) }} por hora
        </div>
        <div class="mt-1 text-sm text-gray-700">
          <span class="font-semibold text-gray-900">Experiencia:</span> {{ profileStore.caregiverProfile?.experience_years || 1 }} {{ (profileStore.caregiverProfile?.experience_years || 1) === 1 ? 'año' : 'años' }}
        </div>
      </div>
      
      <!-- Vista de Perfil -->
      <div v-if="!isEditingProfile" class="flex-1 space-y-6 pt-10 md:pt-0">
        <div>
          <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Biografía y experiencia</h4>
          <p class="text-gray-700 whitespace-pre-line">{{ profileStore.caregiverProfile?.bio || 'Todavía no agregaste una biografía.' }}</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Servicios ofrecidos</h4>
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
            <h4 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Tamaños de mascota aceptados</h4>
            <div class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="size in (profileStore.caregiverProfile?.accepted_sizes?.length ? profileStore.caregiverProfile.accepted_sizes : ['pequeño', 'mediano', 'grande'])"
                :key="size"
                class="px-3 py-1 rounded-full text-xs font-medium bg-(--brand-cream) text-(--header-accent) capitalize"
              >
                {{ size }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
              <h4 class="text-lg font-semibold text-gray-900">Certificaciones y permisos</h4>
              <button type="button" @click="$emit('manage-certifications')" class="text-xs font-semibold text-(--header-accent) hover:text-(--header-text)">
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
            <label class="block text-sm font-medium text-gray-900 mb-1">Foto de perfil (desde tu computadora o celular)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="isUploadingPhoto" @change="handleProfileImageChange" class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-(--brand-cream) file:text-(--header-accent) hover:file:bg-(--brand-cream)"/>
            <p class="mt-1 text-xs text-gray-500">{{ isUploadingPhoto ? 'Subiendo foto...' : 'JPG, PNG o WEBP de hasta 5 MB. Se guarda al instante.' }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Nombre completo</label>
              <input v-model="editFormData.name" type="text" required minlength="2" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="Nombre completo" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Ciudad</label>
              <select v-model="editFormData.city" required class="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2">
                <option v-for="zona in COVERAGE_ZONES" :key="zona" :value="zona">{{ zona }}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Biografía</label>
            <textarea v-model="editFormData.bio" rows="4" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="Contanos sobre vos y tu experiencia..."></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Tarifa por hora (pesos argentinos)</label>
              <input v-model.number="editFormData.hourly_rate" type="number" min="0" step="100" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="4000" />
              <p class="mt-1 text-xs text-gray-500">Los clientes verán {{ formatARS(Number(editFormData.hourly_rate) || 0) }} por hora.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Años de experiencia</label>
              <input v-model.number="editFormData.experience_years" type="number" min="0" max="50" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="1" />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Servicios ofrecidos (separados por coma)</label>
            <input v-model="editFormData.services" type="text" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="Ej: Paseos individuales, Guardería, Entrenamiento básico" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Disponibilidad (separados por coma)</label>
            <input v-model="editFormData.availability" type="text" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="Ej: Lunes, Martes, Fines de semana" />
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
                :class="editFormData.accepted_sizes.includes(size) ? 'bg-(--brand) text-white border-(--brand) shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Teléfono de contacto</label>
            <input v-model="editFormData.phone" type="tel" class="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-(--brand) focus:ring-(--brand) sm:text-sm border p-2" placeholder="299 123-4567" />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="isEditingProfile = false" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              Cancelar
            </button>
            <button type="submit" :disabled="isSavingProfile" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-(--brand) hover:bg-(--brand-dark) focus:outline-none disabled:opacity-50">
              {{ isSavingProfile ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>
