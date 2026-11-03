<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import WorkerCertificationsTab from '../components/worker/WorkerCertificationsTab.vue'
import WorkerGalleryTab from '../components/worker/WorkerGalleryTab.vue'
import WorkerPreviewTab from '../components/worker/WorkerPreviewTab.vue'
import WorkerProfileTab from '../components/worker/WorkerProfileTab.vue'
import WorkerReviewsTab from '../components/worker/WorkerReviewsTab.vue'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

const authStore = useAuthStore()
const profileStore = useProfileStore()

// ---- Disponibilidad para clientes nuevos ----
// Perfiles anteriores a este campo no lo tienen: se consideran disponibles.
const isAvailable = computed(() => profileStore.caregiverProfile?.is_available !== false)
const isSavingAvailability = ref(false)
const availabilityError = ref('')

const toggleAvailability = async () => {
  isSavingAvailability.value = true
  availabilityError.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.updateCaregiverProfile(userId, { is_available: !isAvailable.value })
  } catch (error: any) {
    availabilityError.value = error.message || 'No pudimos cambiar tu disponibilidad.'
  } finally {
    isSavingAvailability.value = false
  }
}

// ---- Estado de aprobación del perfil (lo define el administrador) ----
const profileStatus = computed<'pending' | 'approved' | 'rejected'>(
  () => profileStore.caregiverProfile?.status || 'approved',
)

// La pestaña inicial puede venir en la URL: /mi-panel?tab=vista-previa
const TABS = ['perfil', 'certificaciones', 'galeria', 'resenas', 'vista-previa']
const route = useRoute()
const activeTab = ref(
  typeof route.query.tab === 'string' && TABS.includes(route.query.tab) ? route.query.tab : 'perfil',
)
const isLoading = ref(true)

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
        authStore.persistUser()
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 pb-12">
    <!-- Header del Dashboard -->
    <div class="bg-(--brand) pb-24">
      <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-white">Mi panel</h1>
        <p class="mt-2 text-white/80">
          Gestioná tu perfil, tus certificaciones y tus fotos, mirá tus reseñas y revisá cómo te ven los clientes.
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">

      <!-- Estado del perfil y disponibilidad -->
      <div v-if="!isLoading && profileStore.caregiverProfile" class="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Interruptor Disponible / No disponible -->
        <div class="bg-white rounded-xl shadow p-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Cómo te ven los clientes</p>
            <p class="mt-1 text-lg font-bold" :class="isAvailable ? 'text-emerald-700' : 'text-gray-700'">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full mr-1.5 align-middle"
                :class="isAvailable ? 'bg-emerald-500' : 'bg-gray-400'"
                aria-hidden="true"
              />
              {{ isAvailable ? 'Disponible' : 'No disponible' }}
            </p>
            <p class="text-sm text-gray-500">
              {{
                isAvailable
                  ? 'Recibís contactos de clientes nuevos.'
                  : 'Tu perfil se ve, pero no se puede contactar.'
              }}
            </p>
            <p v-if="availabilityError" class="mt-1 text-sm text-red-600">{{ availabilityError }}</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="isAvailable"
            aria-label="Disponible para clientes nuevos"
            :disabled="isSavingAvailability"
            class="relative h-8 w-14 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) disabled:opacity-60"
            :class="isAvailable ? 'bg-emerald-500' : 'bg-gray-300'"
            @click="toggleAvailability"
          >
            <span
              class="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform"
              :class="isAvailable ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Estado de aprobación -->
        <div
          class="rounded-xl shadow p-5 border"
          :class="{
            'bg-amber-50 border-amber-200': profileStatus === 'pending',
            'bg-green-50 border-green-200': profileStatus === 'approved',
            'bg-red-50 border-red-200': profileStatus === 'rejected',
          }"
        >
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Estado de tu perfil</p>
          <template v-if="profileStatus === 'pending'">
            <p class="mt-1 text-lg font-bold text-amber-800">⏳ En revisión</p>
            <p class="text-sm text-amber-900">
              Un administrador está revisando tu perfil. Todavía no aparecés en el listado público.
              Completá tu foto, biografía y comprobantes para que te aprueben más rápido.
            </p>
          </template>
          <template v-else-if="profileStatus === 'approved'">
            <p class="mt-1 text-lg font-bold text-green-800">✓ Aprobado</p>
            <p class="text-sm text-green-900">Tu perfil es público y los clientes pueden encontrarte.</p>
          </template>
          <template v-else>
            <p class="mt-1 text-lg font-bold text-red-700">Rechazado</p>
            <p class="text-sm text-red-800">
              Tu perfil no está visible. Revisá tus datos y comprobantes y contactá al administrador.
            </p>
          </template>
        </div>
      </div>

      <!-- Navegación por pestañas -->
      <div class="bg-white rounded-t-xl border-b border-gray-200 overflow-x-auto">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button @click="activeTab = 'perfil'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'perfil' ? 'border-(--brand) text-(--header-accent)' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Mi perfil
          </button>
          <button @click="activeTab = 'certificaciones'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'certificaciones' ? 'border-(--brand) text-(--header-accent)' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Certificaciones y permisos
          </button>
          <button @click="activeTab = 'galeria'" 
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'galeria' ? 'border-(--brand) text-(--header-accent)' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Mi galería ({{ profileStore.caregiverProfile?.gallery_images?.length || 0 }})
          </button>
          <button @click="activeTab = 'resenas'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'resenas' ? 'border-(--brand) text-(--header-accent)' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            Mis reseñas ({{ profileStore.reviews.length }})
          </button>
          <button @click="activeTab = 'vista-previa'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === 'vista-previa' ? 'border-(--brand) text-(--header-accent)' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'">
            👁 Vista previa
          </button>
        </nav>
      </div>

      <div class="bg-white text-gray-900 shadow rounded-b-xl min-h-[400px]">
        <div v-if="isLoading" class="flex justify-center items-center h-64 text-gray-500">
          Cargando datos...
        </div>

        <div v-else class="p-6 sm:p-8">
          <!-- KeepAlive: cambiar de pestaña no pierde lo que se estaba editando -->
          <KeepAlive>
            <WorkerProfileTab
              v-if="activeTab === 'perfil'"
              @manage-certifications="activeTab = 'certificaciones'"
            />
            <WorkerCertificationsTab v-else-if="activeTab === 'certificaciones'" />
            <WorkerGalleryTab v-else-if="activeTab === 'galeria'" />
            <WorkerReviewsTab v-else-if="activeTab === 'resenas'" />
            <WorkerPreviewTab v-else-if="activeTab === 'vista-previa'" :profile-status="profileStatus" />
          </KeepAlive>
        </div>
      </div>

    </div>
  </div>
</template>
