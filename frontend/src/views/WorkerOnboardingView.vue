<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const isLoading = ref(false)
const errorMsg = ref('')

const bio = ref('')
const services = ref<string[]>([])
const availability = ref<string[]>([])
const hourlyRate = ref<number>(4000)
const experienceYears = ref<number>(1)
const acceptedSizes = ref<string[]>(['pequeño', 'mediano', 'grande'])
const certifications = ref<string[]>([])
const customCertification = ref('')
const profileImage = ref<File | null>(null)
const profileImagePreview = ref<string | null>(null)

// Días de disponibilidad, tamaños y certificaciones sugeridas
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const petSizes = ['pequeño', 'mediano', 'grande']
const presetCertifications = [
  'Permiso Municipal Vigente',
  'Registro Municipal de Paseadores',
  'Primeros Auxilios Veterinarios',
  'Adiestramiento Canino',
]

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
  }
})

const handleImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    profileImage.value = null
    profileImagePreview.value = null
    return
  }

  profileImage.value = file
  profileImagePreview.value = URL.createObjectURL(file)
}

const toggleService = (service: string) => {
  if (services.value.includes(service)) {
    services.value = services.value.filter(s => s !== service)
  } else {
    services.value.push(service)
  }
}

const toggleDay = (day: string) => {
  if (availability.value.includes(day)) {
    availability.value = availability.value.filter(d => d !== day)
  } else {
    availability.value.push(day)
  }
}

const toggleSize = (size: string) => {
  if (acceptedSizes.value.includes(size)) {
    acceptedSizes.value = acceptedSizes.value.filter(s => s !== size)
  } else {
    acceptedSizes.value.push(size)
  }
}

const toggleCertification = (cert: string) => {
  if (certifications.value.includes(cert)) {
    certifications.value = certifications.value.filter(c => c !== cert)
  } else {
    certifications.value.push(cert)
  }
}

const addCustomCert = () => {
  const val = customCertification.value.trim()
  if (val && !certifications.value.includes(val)) {
    certifications.value.push(val)
  }
  customCertification.value = ''
}

const handleSaveProfile = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    
    // 1. Guardar la imagen primero si existe
    if (profileImage.value) {
      await profileStore.uploadProfileImage(userId, profileImage.value)
    }

    // 2. Guardar el resto de los datos
    await profileStore.updateCaregiverProfile(userId, {
      bio: bio.value,
      services: services.value,
      availability: availability.value,
      hourly_rate: Number(hourlyRate.value) || 4000,
      experience_years: Number(experienceYears.value) || 1,
      accepted_sizes: acceptedSizes.value.length > 0 ? acceptedSizes.value : ['pequeño', 'mediano', 'grande'],
      certifications: certifications.value,
    })
    
    // Ir al panel principal
    router.push('/mi-panel')
  } catch (error: any) {
    errorMsg.value = error.message || 'Error al guardar el perfil'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
    <div class="max-w-2xl w-full bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      
      <div class="bg-indigo-600 px-8 py-6 text-white text-center">
        <h2 class="text-2xl font-bold">Completa tu perfil profesional</h2>
        <p class="mt-2 text-indigo-100 text-sm">Ayuda a los dueños de mascotas a conocerte mejor para que confíen en tus servicios.</p>
      </div>
      
      <form class="px-8 py-8 space-y-8" @submit.prevent="handleSaveProfile">
        
        <!-- Sección de Foto -->
        <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div class="flex-shrink-0">
            <div v-if="profileImagePreview" class="h-24 w-24 rounded-full overflow-hidden border-2 border-indigo-200">
              <img :src="profileImagePreview" alt="Profile Preview" class="h-full w-full object-cover" />
            </div>
            <div v-else class="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <span class="text-gray-400 text-3xl">👤</span>
            </div>
          </div>
          <div class="flex-1 text-center sm:text-left">
            <label class="block text-sm font-medium text-gray-800 mb-2">Sube una foto de perfil (Opcional pero recomendado)</label>
            <input type="file" accept="image/*" class="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" @change="handleImageChange" />
          </div>
        </div>

        <!-- Sección de Bio -->
        <div>
          <label class="block text-sm font-medium text-gray-800 mb-2">Cuéntanos sobre ti y tu experiencia con mascotas</label>
          <textarea v-model="bio" rows="4" class="block w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" placeholder="Ej. Llevo más de 5 años cuidando perritos y me encanta pasar tiempo con ellos en parques..."></textarea>
        </div>

        <!-- Tarifa por hora y Años de experiencia -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-800 mb-2">Tarifa por hora ($)</label>
            <input v-model.number="hourlyRate" type="number" min="0" step="100" class="block w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" placeholder="4000" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 mb-2">Años de experiencia</label>
            <input v-model.number="experienceYears" type="number" min="0" max="50" class="block w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" placeholder="1" />
          </div>
        </div>

        <!-- Servicios Adicionales -->
        <div>
          <label class="block text-sm font-medium text-gray-800 mb-2">Servicios que ofreces (Selecciona los que apliquen)</label>
          <div class="grid grid-cols-2 gap-4">
            <label class="relative flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" :class="services.includes('Paseo') ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'">
              <input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" :checked="services.includes('Paseo')" @change="toggleService('Paseo')">
              <span class="ml-3 font-medium text-gray-900">Paseo de Perros</span>
            </label>
            <label class="relative flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" :class="services.includes('Cuidado en casa') ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'">
              <input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" :checked="services.includes('Cuidado en casa')" @change="toggleService('Cuidado en casa')">
              <span class="ml-3 font-medium text-gray-900">Cuidado en casa</span>
            </label>
            <label class="relative flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" :class="services.includes('Visitas a domicilio') ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'">
              <input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" :checked="services.includes('Visitas a domicilio')" @change="toggleService('Visitas a domicilio')">
              <span class="ml-3 font-medium text-gray-900">Visitas a domicilio</span>
            </label>
          </div>
        </div>

        <!-- Tamaños de mascota aceptados -->
        <div>
          <label class="block text-sm font-medium text-gray-800 mb-2">Tamaños de mascota que aceptas</label>
          <div class="flex flex-wrap gap-2">
            <button type="button" v-for="size in petSizes" :key="size" @click="toggleSize(size)"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors border capitalize"
              :class="acceptedSizes.includes(size) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
              {{ size }}
            </button>
          </div>
        </div>

        <!-- Certificaciones y Permisos Municipales -->
        <div>
          <label class="block text-sm font-medium text-gray-800 mb-2">Certificaciones y Permisos Municipales (Opcional)</label>
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              v-for="cert in presetCertifications"
              :key="cert"
              @click="toggleCertification(cert)"
              class="px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border"
              :class="certifications.includes(cert) ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              {{ certifications.includes(cert) ? '✓ ' : '+ ' }}{{ cert }}
            </button>
          </div>
          <div class="flex gap-2">
            <input
              v-model="customCertification"
              type="text"
              maxlength="120"
              @keydown.enter.prevent="addCustomCert"
              class="flex-1 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg text-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Permiso Municipal Cipolletti N° 458"
            />
            <button
              type="button"
              @click="addCustomCert"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg border border-gray-300 transition-colors"
            >
              Añadir
            </button>
          </div>
          <div v-if="certifications.length > 0" class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="cert in certifications"
              :key="cert"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300"
            >
              🏅 {{ cert }}
              <button type="button" @click="toggleCertification(cert)" class="text-amber-700 hover:text-red-600 font-bold">✕</button>
            </span>
          </div>
        </div>

        <!-- Disponibilidad -->
        <div>
          <label class="block text-sm font-medium text-gray-800 mb-2">Días disponibles</label>
          <div class="flex flex-wrap gap-2">
            <button type="button" v-for="day in daysOfWeek" :key="day" @click="toggleDay(day)"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors border"
              :class="availability.includes(day) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
              {{ day }}
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-600 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
          {{ errorMsg }}
        </div>

        <div class="pt-4">
          <button type="submit" :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all">
            {{ isLoading ? 'Guardando perfil...' : 'Guardar Perfil e Ir a mi Panel' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>
