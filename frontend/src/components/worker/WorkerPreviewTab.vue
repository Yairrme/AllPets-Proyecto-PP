<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import { formatARS } from '../../utils/currency'
import { toPaseador } from '../../utils/paseador'
import PaseadorCard from '../paseadores/PaseadorCard.vue'

defineProps<{ profileStatus: 'pending' | 'approved' | 'rejected' }>()

const authStore = useAuthStore()
const profileStore = useProfileStore()

// ---- Vista previa: la misma tarjeta y los mismos datos que ve un cliente ----
const preview = computed(() =>
  authStore.user && profileStore.caregiverProfile
    ? toPaseador(authStore.user, profileStore.caregiverProfile)
    : null,
)
const previewDetailRef = ref<HTMLElement | null>(null)
const previewNotice = ref('')

function previewVerPerfil() {
  previewDetailRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function previewContactar() {
  previewNotice.value = 'En la vista previa no se abre WhatsApp: así lo verá el cliente al tocar "Contactar".'
}
</script>

<template>
  <div v-if="preview" class="space-y-6">
    <div>
      <h4 class="text-xl font-bold text-gray-900">Así te ven los clientes</h4>
      <p class="text-sm text-gray-600">
        Es la misma tarjeta y el mismo perfil que aparecen en el listado público. Los cambios
        que guardes en tu perfil se reflejan acá al instante.
      </p>
    </div>

    <p
      v-if="profileStatus !== 'approved'"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
    >
      {{
        profileStatus === 'pending'
          ? '⏳ Tu perfil todavía está en revisión: los clientes lo van a ver así cuando un administrador lo apruebe.'
          : 'Tu perfil fue rechazado y no se muestra en el listado. Revisá tus datos y contactá al administrador.'
      }}
    </p>
    <p
      v-if="previewNotice"
      role="status"
      class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
    >
      {{ previewNotice }}
    </p>

    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <!-- Tarjeta del listado -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">En el listado</p>
        <PaseadorCard
          :paseador="preview"
          @ver-perfil="previewVerPerfil"
          @contactar="previewContactar"
        />
      </div>

      <!-- Perfil completo (lo que se abre con "Ver perfil") -->
      <div ref="previewDetailRef" class="scroll-mt-40">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Perfil completo</p>
        <article class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <header class="flex flex-wrap items-center gap-5 border-b border-gray-200 p-6">
            <img
              :src="preview.foto"
              :alt="`Foto de ${preview.nombre}`"
              class="h-24 w-24 rounded-2xl border border-gray-200 object-cover"
            />
            <div class="min-w-0 flex-1">
              <h5 class="preview-serif text-2xl font-semibold text-gray-900">{{ preview.nombre }}</h5>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>📍 {{ preview.zona }}</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  :class="preview.disponible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'"
                >
                  {{ preview.disponible ? 'Disponible' : 'No disponible por ahora' }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-600">
                ★ {{ preview.totalResenas > 0 ? preview.calificacion : 'Nuevo' }} ·
                {{ preview.totalResenas }} {{ preview.totalResenas === 1 ? 'reseña' : 'reseñas' }} ·
                {{ preview.aniosExperiencia }} {{ preview.aniosExperiencia === 1 ? 'año' : 'años' }} de experiencia
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">Tarifa por hora</p>
              <p class="preview-serif text-2xl font-semibold text-(--header-accent)">{{ formatARS(preview.tarifaHora) }}</p>
            </div>
          </header>

          <div class="space-y-6 p-6">
            <section>
              <h6 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Sobre mí</h6>
              <p class="whitespace-pre-line text-gray-700">{{ preview.biografia }}</p>
            </section>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <section>
                <h6 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Especialidades</h6>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="esp in preview.especialidades" :key="esp" class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700">{{ esp }}</span>
                </div>
              </section>
              <section>
                <h6 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Certificaciones y permisos</h6>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="ins in preview.insignias" :key="ins" class="rounded-lg border border-(--brand) px-2.5 py-1 text-xs font-semibold text-(--header-accent)">✓ {{ ins }}</span>
                </div>
              </section>
              <section>
                <h6 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Días disponibles</h6>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="dia in preview.diasDisponibles" :key="dia" class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700">{{ dia }}</span>
                </div>
              </section>
              <section>
                <h6 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Tamaños aceptados</h6>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="tam in preview.tamanosAceptados" :key="tam" class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs capitalize text-gray-700">{{ tam }}</span>
                </div>
              </section>
            </div>

            <section>
              <h6 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Galería de fotos</h6>
              <div v-if="preview.galeriaFotos.length" class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                <img
                  v-for="(foto, idx) in preview.galeriaFotos"
                  :key="foto"
                  :src="foto"
                  :alt="`Foto ${idx + 1} de la galería`"
                  class="aspect-square w-full rounded-xl border border-gray-200 object-cover"
                />
              </div>
              <p v-else class="text-sm text-gray-500">Todavía no subiste fotos a tu galería.</p>
            </section>

            <p class="border-t border-gray-200 pt-4 text-sm text-gray-600">
              📞 Contacto: <span class="font-semibold text-gray-900">{{ preview.telefono || 'Sin teléfono cargado' }}</span>
            </p>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Misma tipografía de títulos que el perfil público */
.preview-serif {
  font-family: 'Fraunces', ui-serif, Georgia, serif;
}
</style>
