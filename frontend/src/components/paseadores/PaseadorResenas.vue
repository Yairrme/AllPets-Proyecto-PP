<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'

const props = defineProps<{ caregiverId: string }>()
// Calificar cambia el promedio del prestador: la vista lo vuelve a pedir.
const emit = defineEmits<{ (e: 'changed'): void }>()

const authStore = useAuthStore()
const profileStore = useProfileStore()

const isClient = computed(() => authStore.user?.role === 'client')
const miResena = ref<any | null>(null)
const isEditing = ref(false)
const isConfirmingDelete = ref(false)
const isSaving = ref(false)
const score = ref(5)
const comment = ref('')
const error = ref('')
const success = ref('')

// La propia va aparte, con sus acciones: puede no estar en la página cargada.
const otrasResenas = computed(() =>
  profileStore.reviews.filter((review) => review._id !== miResena.value?._id),
)
const mostrarFormulario = computed(() => isClient.value && (!miResena.value || isEditing.value))

onMounted(async () => {
  await Promise.all([
    profileStore.fetchReviews(props.caregiverId).catch(() => {
      error.value = 'No se pudieron cargar las reseñas.'
    }),
    isClient.value
      ? profileStore
          .fetchMyReview(props.caregiverId)
          .then((review) => (miResena.value = review))
          .catch(() => {})
      : undefined,
  ])
})

function limpiarAvisos() {
  error.value = ''
  success.value = ''
  isConfirmingDelete.value = false
}

function empezarEdicion() {
  limpiarAvisos()
  score.value = miResena.value.score
  comment.value = miResena.value.comment ?? ''
  isEditing.value = true
}

function cancelarEdicion() {
  limpiarAvisos()
  isEditing.value = false
}

async function guardar() {
  limpiarAvisos()
  isSaving.value = true
  const datos = { score: score.value, comment: comment.value.trim() }
  try {
    miResena.value = isEditing.value
      ? await profileStore.updateReview(miResena.value._id, datos)
      : await profileStore.createReview({ caregiver_id: props.caregiverId, ...datos })
    isEditing.value = false
    success.value = 'Tu reseña fue guardada correctamente.'
    emit('changed')
  } catch (e: any) {
    error.value = e.message || 'No se pudo guardar la reseña.'
  } finally {
    isSaving.value = false
  }
}

async function eliminar() {
  limpiarAvisos()
  isSaving.value = true
  try {
    await profileStore.deleteReview(miResena.value._id)
    miResena.value = null
    score.value = 5
    comment.value = ''
    success.value = 'Tu reseña fue eliminada.'
    emit('changed')
  } catch (e: any) {
    error.value = e.message || 'No se pudo eliminar la reseña.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="border-t border-(--color-line) pt-6">
    <h4 class="wp-label mb-3">Reseñas de clientes</h4>

    <!-- Reseña propia -->
    <div
      v-if="miResena && !isEditing"
      class="rounded-xl bg-(--color-paper) p-4 border border-(--color-forest) mb-3"
      data-testid="mi-resena"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="font-medium text-sm">Tu reseña</span>
        <span class="flex gap-0.5" :aria-label="`${miResena.score} de 5 estrellas`">
          <svg v-for="n in 5" :key="n" width="12" height="12" viewBox="0 0 24 24"
            :fill="n <= miResena.score ? '#C99A46' : 'none'"
            :stroke="n <= miResena.score ? '#C99A46' : '#1E2B22'" stroke-opacity="0.3" stroke-width="1.5">
            <path d="M12 2l2.9 6.26 6.9.6-5.2 4.6 1.6 6.76L12 16.9l-6.2 3.32 1.6-6.76-5.2-4.6 6.9-.6z"/>
          </svg>
        </span>
      </div>
      <p v-if="miResena.comment" class="text-sm text-(--color-ink)/70 mt-2">{{ miResena.comment }}</p>

      <div v-if="isConfirmingDelete" class="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span>¿Eliminar tu reseña?</span>
        <button type="button" class="font-semibold text-(--color-clay) underline disabled:opacity-50" :disabled="isSaving" @click="eliminar">
          {{ isSaving ? 'Eliminando...' : 'Sí, eliminar' }}
        </button>
        <button type="button" class="font-semibold underline" @click="isConfirmingDelete = false">No</button>
      </div>
      <div v-else class="mt-3 flex gap-4 text-sm">
        <button type="button" class="font-semibold text-(--color-forest) underline" @click="empezarEdicion">Editar</button>
        <button type="button" class="font-semibold text-(--color-clay) underline" @click="isConfirmingDelete = true">Eliminar</button>
      </div>
    </div>

    <!-- Reseñas de otros clientes -->
    <div v-if="otrasResenas.length" class="space-y-3 mb-5">
      <div
        v-for="review in otrasResenas"
        :key="review._id"
        class="rounded-xl bg-(--color-paper) p-4 border border-(--color-line)"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="font-medium text-sm">{{ review.reviewer_id?.name || 'Cliente' }}</span>
          <span class="flex gap-0.5">
            <svg v-for="n in 5" :key="n" width="12" height="12" viewBox="0 0 24 24"
              :fill="n <= review.score ? '#C99A46' : 'none'"
              :stroke="n <= review.score ? '#C99A46' : '#1E2B22'" stroke-opacity="0.3" stroke-width="1.5">
              <path d="M12 2l2.9 6.26 6.9.6-5.2 4.6 1.6 6.76L12 16.9l-6.2 3.32 1.6-6.76-5.2-4.6 6.9-.6z"/>
            </svg>
          </span>
        </div>
        <p v-if="review.comment" class="text-sm text-(--color-ink)/70 mt-2">{{ review.comment }}</p>
      </div>
    </div>
    <p v-else-if="!miResena" class="text-sm text-(--color-ink)/55 mb-5">Todavía no hay reseñas para este perfil.</p>

    <form v-if="mostrarFormulario" class="rounded-xl border border-(--color-line) p-4" @submit.prevent="guardar">
      <p class="font-medium text-sm mb-3">{{ isEditing ? 'Editá tu reseña' : 'Dejá tu reseña' }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
        <select v-model.number="score" class="wp-input" aria-label="Calificación">
          <option :value="5">5 estrellas</option>
          <option :value="4">4 estrellas</option>
          <option :value="3">3 estrellas</option>
          <option :value="2">2 estrellas</option>
          <option :value="1">1 estrella</option>
        </select>
        <input v-model="comment" type="text" maxlength="500" class="wp-input" placeholder="Escribí un comentario (opcional)" aria-label="Comentario" />
      </div>
      <div class="mt-3 flex items-center gap-3">
        <button type="submit" :disabled="isSaving" class="wp-btn-primary disabled:opacity-50">
          {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar reseña' }}
        </button>
        <button v-if="isEditing" type="button" class="wp-btn-ghost" @click="cancelarEdicion">Cancelar</button>
      </div>
    </form>
    <p v-else-if="!isClient" class="text-xs text-(--color-ink)/50">Iniciá sesión como cliente para dejar una reseña.</p>

    <p v-if="success" role="status" class="mt-2 text-sm text-(--color-forest)">{{ success }}</p>
    <p v-if="error" role="alert" class="mt-2 text-sm text-(--color-clay)">{{ error }}</p>
  </div>
</template>
