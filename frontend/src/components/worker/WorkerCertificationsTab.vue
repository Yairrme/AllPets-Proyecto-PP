<script setup lang="ts">
import { ref } from 'vue'
import { useCertificationDocuments } from '../../composables/useCertificationDocuments'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'

const authStore = useAuthStore()
const profileStore = useProfileStore()

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
const certDocsError = ref('')
const { documents: certDocuments } = useCertificationDocuments(
  () => authStore.user?._id || authStore.user?.id,
  () => profileStore.caregiverProfile?.certification_documents ?? [],
)

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
  certDocsError.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.uploadCertificationDocuments(userId, certDocFiles.value)
    certDocFiles.value = []
    certDocPreviewUrls.value = []
  } catch (error: any) {
    certDocsError.value = error.message || 'No pudimos subir los comprobantes.'
  } finally {
    isUploadingCertDocs.value = false
  }
}

const removeCertificationDocument = async (filename: string) => {
  certDocsError.value = ''
  try {
    const userId = authStore.user._id || authStore.user.id
    await profileStore.removeCertificationDocument(userId, filename)
  } catch (error: any) {
    certDocsError.value = error.message || 'No pudimos eliminar el comprobante.'
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h4 class="text-xl font-bold text-gray-900 mb-1">Certificaciones y permisos municipales</h4>
      <p class="text-sm text-gray-600">
        Agregá tus habilitaciones municipales (Cipolletti / Neuquén), cursos o certificaciones profesionales para destacar tu perfil y brindar mayor seguridad a los dueños de mascotas.
      </p>
    </div>

    <!-- Selección rápida de permisos y certificaciones frecuentes -->
    <div class="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-2">
          Elegí permisos o certificaciones frecuentes:
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
              ? 'bg-(--brand) text-white border-(--brand) shadow-xs'
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
            class="flex-1 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3.5 py-2 text-sm focus:border-(--brand) focus:ring-(--brand)"
            placeholder="Ej: Permiso Municipal Cipolletti N° 458 / Curso de Etología Canina"
          />
          <button
            type="submit"
            :disabled="isSavingCertifications || !newCustomCertification.trim()"
            class="px-5 py-2 bg-(--brand) text-white rounded-lg hover:bg-(--brand-dark) text-sm font-semibold transition-colors disabled:opacity-50"
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
        Todavía no agregaste certificaciones ni permisos municipales.
      </p>
    </div>

    <!-- Subida de comprobantes / fotos de certificados o carnet municipal -->
    <div class="pt-6 border-t border-gray-200">
      <div class="mb-6 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <h5 class="text-base font-semibold text-gray-900 mb-1">
          Subir fotos de tus certificados o carnet / permiso municipal
        </h5>
        <p class="text-sm text-gray-600 mb-4">
          Adjuntá imágenes de tus diplomas, certificados o credencial municipal. Solo las ve el equipo de AllPets para verificar tu perfil; los clientes ven la insignia, no los documentos.
        </p>

        <p v-if="certDocsError" class="mb-3 text-sm text-red-600">{{ certDocsError }}</p>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            type="file"
            multiple
            accept="image/*"
            @change="handleCertDocFiles"
            class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-(--brand-cream) file:text-(--header-accent) hover:file:bg-(--brand-cream)"
          />
          <button
            v-if="certDocFiles.length > 0"
            type="button"
            @click="uploadCertDocs"
            :disabled="isUploadingCertDocs"
            class="px-5 py-2 bg-(--brand) text-white rounded-lg hover:bg-(--brand-dark) font-medium whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {{ isUploadingCertDocs ? 'Subiendo...' : 'Subir comprobantes' }}
          </button>
        </div>

        <div v-if="certDocPreviewUrls.length > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="(url, idx) in certDocPreviewUrls" :key="idx" class="h-28 rounded-lg overflow-hidden border border-gray-300 bg-white">
            <img :src="url" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <h5 class="text-base font-bold text-gray-900 mb-3">Comprobantes enviados</h5>
      <div
        v-if="profileStore.caregiverProfile?.certification_documents?.length > 0"
        class="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div
          v-for="doc in certDocuments"
          :key="doc.filename"
          class="aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-gray-200 group relative bg-gray-100"
        >
          <img :src="doc.url" class="w-full h-full object-cover" />
          <button
            type="button"
            @click="removeCertificationDocument(doc.filename)"
            class="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold w-7 h-7 rounded-full shadow flex items-center justify-center"
            title="Eliminar comprobante"
          >
            ✕
          </button>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl text-sm">
        Todavía no subiste fotos de certificados o permisos municipales.
      </div>
    </div>
  </div>
</template>
