<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePaseadoresStore } from '../stores/paseadores'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import type { Paseador } from '../types/paseador'

import PaseadorCard from '../components/paseadores/PaseadorCard.vue'
import PaseadoresFilter from '../components/paseadores/PaseadoresFilter.vue'

const store = usePaseadoresStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()

onMounted(() => {
  store.fetchPaseadores()
})

const selectedPaseador = ref<Paseador | null>(null)
const isPerfilModalOpen = ref(false)
const perfilPaseador = ref<Paseador | null>(null)
const reviewScore = ref(5)
const reviewComment = ref('')
const reviewError = ref('')
const reviewSuccess = ref('')
const isSavingReview = ref(false)

function sanitizePhone(phone: string) {
  return phone.replace(/[^\d]/g, '')
}

function handleContactar(paseador: Paseador) {
  selectedPaseador.value = paseador
  const telefono = paseador.telefono
  if (!telefono) return
  const phone = sanitizePhone(telefono)
  const nombreCorto = paseador.nombre.split(' ')[0] || paseador.nombre
  window.open(`https://wa.me/${phone}?text=Hola%20${encodeURIComponent(nombreCorto)},%20me%20gustaría%20contactarte%20para%20un%20paseo.`, '_blank')
}

function handleVerPerfil(paseador: Paseador) {
  perfilPaseador.value = paseador
  isPerfilModalOpen.value = true
  reviewError.value = ''
  reviewSuccess.value = ''
  profileStore.fetchReviews(paseador.id).catch(() => {
    reviewError.value = 'No se pudieron cargar las reseñas.'
  })
}

async function handleCreateReview() {
  if (!authStore.user || authStore.user.role !== 'client' || !perfilPaseador.value) return

  reviewError.value = ''
  reviewSuccess.value = ''
  isSavingReview.value = true
  try {
    await profileStore.createReview({
      reviewer_id: authStore.user._id || authStore.user.id,
      caregiver_id: perfilPaseador.value.id,
      score: reviewScore.value,
      comment: reviewComment.value.trim(),
    })
    reviewComment.value = ''
    reviewScore.value = 5
    reviewSuccess.value = 'Tu reseña fue guardada correctamente.'
  } catch (error: any) {
    reviewError.value = error.message || 'No se pudo guardar la reseña.'
  } finally {
    isSavingReview.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white text-[--color-ink] pb-24 wp-root">

    <div class="max-w-6xl mx-auto px-5 sm:px-8 pt-10">

      <!-- Marca -->
      <div class="flex items-baseline justify-between mb-10">
        <span class="wp-serif text-xl font-semibold tracking-tight">WalkPets</span>
        <span class="hidden sm:block text-sm text-[--color-ink]/50">Cipolletti y alrededores</span>
      </div>

      <!-- Hero -->
      <div class="relative pb-12 mb-12 border-b border-[--color-line]">
        <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
          <div class="max-w-xl">
            <h1 class="wp-serif text-[2.35rem] sm:text-[3.2rem] leading-[1.05] font-semibold mb-5">
              Encuentra el paseador ideal para tu mascota
            </h1>
            <p class="text-[15px] sm:text-base text-[--color-ink]/70 leading-relaxed max-w-md">
              Paseadores y cuidadores verificados en Cipolletti y Neuquén. Mirá su perfil, consultá la tarifa y contactalos por WhatsApp.
            </p>
          </div>

          <div class="grid max-w-sm grid-cols-1 gap-3 text-sm text-[--color-ink]/70 lg:justify-self-end">
            <div class="flex items-center gap-3 border-b border-[--color-line] pb-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-forest] text-[--color-paper]">1</span>
              <span>Elegí tu ciudad y compará perfiles.</span>
            </div>
            <div class="flex items-center gap-3 border-b border-[--color-line] pb-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-forest] text-[--color-paper]">2</span>
              <span>Revisá experiencia, tarifa y reseñas.</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-forest] text-[--color-paper]">3</span>
              <span>Contactá directamente al trabajador.</span>
            </div>
          </div>
        </div>

        <!-- Motivo decorativo: un único trazo con huellas, discreto -->
        <svg class="absolute -bottom-px right-0 hidden lg:block opacity-70" width="180" height="16" viewBox="0 0 180 16" fill="none">
          <path d="M2 8 H176" stroke="#B15A34" stroke-width="1.5" stroke-dasharray="1 7" stroke-linecap="round" />
          <circle cx="60" cy="8" r="2.5" fill="#B15A34" />
          <circle cx="120" cy="8" r="2.5" fill="#B15A34" />
        </svg>
      </div>

      <!-- Filtros -->
      <PaseadoresFilter />

      <!-- Cabecera de listado -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mt-10 mb-6">
        <h2 class="wp-serif text-2xl font-semibold">
          Paseadores disponibles
          <span class="wp-serif text-lg text-[--color-ink]/40 font-normal">— {{ store.paseadoresFiltrados.length }}</span>
        </h2>
        <p class="text-xs text-[--color-ink]/50">
          Tarifas por hora, sin sorpresas
        </p>
      </div>

      <!-- Grilla -->
      <div
        v-if="store.paseadoresFiltrados.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <PaseadorCard
          v-for="paseador in store.paseadoresFiltrados"
          :key="paseador.id"
          :paseador="paseador"
          @contactar="handleContactar"
          @ver-perfil="handleVerPerfil"
        />
      </div>

      <!-- Estado vacío -->
      <div
        v-else
        class="wp-card p-14 text-center max-w-lg mx-auto mt-4"
      >
        <svg class="mx-auto mb-5" width="40" height="40" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#1E2B22" stroke-opacity="0.35" stroke-width="1.6" />
          <path d="M20 20L16.2 16.2" stroke="#1E2B22" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <h3 class="wp-serif text-lg font-semibold mb-2">
          No hay paseadores en esta ciudad
        </h3>
        <p class="text-sm text-[--color-ink]/60 mb-7 leading-relaxed">
          Todavía no tenemos paseadores en la zona seleccionada. Probá con otra ciudad o mirá toda la red disponible.
        </p>
        <button
          @click="store.resetFiltros"
          class="wp-btn-primary"
        >
          Mostrar todas las ciudades
        </button>
      </div>

    </div>

    <!-- Modal de perfil -->
    <Teleport to="body">
      <div
        v-if="isPerfilModalOpen && perfilPaseador"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--color-ink]/50 backdrop-blur-[2px]"
        @click.self="isPerfilModalOpen = false"
      >
        <div class="wp-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-9 flex flex-col">

          <!-- Encabezado -->
          <div class="flex items-start justify-between gap-4 border-b border-[--color-line] pb-6 mb-6">
            <div class="flex items-center gap-4">
              <img
                :src="perfilPaseador.foto"
                :alt="perfilPaseador.nombre"
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-[--color-line]"
              />
              <div>
                <h3 class="wp-serif text-2xl font-semibold">{{ perfilPaseador.nombre }}</h3>
                <p class="text-sm text-[--color-forest] font-medium mt-0.5">{{ perfilPaseador.zona || 'Cipolletti' }}</p>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[--color-ink]/55 mt-1.5">
                  <span class="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#C99A46"><path d="M12 2l2.9 6.26 6.9.6-5.2 4.6 1.6 6.76L12 16.9l-6.2 3.32 1.6-6.76-5.2-4.6 6.9-.6z"/></svg>
                    {{ perfilPaseador.calificacion }}
                  </span>
                  <span class="text-[--color-ink]/25">·</span>
                  <span>{{ perfilPaseador.totalResenas }} reseñas</span>
                  <span class="text-[--color-ink]/25">·</span>
                  <span class="font-medium text-[--color-forest]">{{ perfilPaseador.telefono || 'Teléfono no disponible' }}</span>
                </div>
              </div>
            </div>
            <button
              @click="isPerfilModalOpen = false"
              class="w-8 h-8 shrink-0 rounded-lg border border-[--color-line] text-[--color-ink]/50 hover:text-[--color-ink] hover:border-[--color-ink]/30 transition-colors"
            >
              ✕
            </button>
          </div>

          <div class="space-y-7">
            <div>
              <h4 class="wp-label mb-2">Sobre mí</h4>
              <p class="text-sm text-[--color-ink]/75 leading-relaxed">
                {{ perfilPaseador.biografia }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 class="wp-label mb-2">Especialidades</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="esp in perfilPaseador.especialidades" :key="esp" class="wp-tag">
                    {{ esp }}
                  </span>
                </div>
              </div>
              <div>
                <h4 class="wp-label mb-2">Verificaciones</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="ins in perfilPaseador.insignias" :key="ins" class="wp-tag">
                    {{ ins }}
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 class="wp-label mb-2">Días disponibles</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="dia in perfilPaseador.diasDisponibles" :key="dia" class="wp-tag">
                    {{ dia }}
                  </span>
                </div>
              </div>
              <div>
                <h4 class="wp-label mb-2">Tamaños aceptados</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="tam in perfilPaseador.tamanosAceptados" :key="tam" class="wp-tag wp-tag-strong">
                    {{ tam }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Reseñas -->
            <div class="border-t border-[--color-line] pt-6">
              <h4 class="wp-label mb-3">Reseñas de clientes</h4>

              <div v-if="profileStore.reviews.length" class="space-y-3 mb-5">
                <div
                  v-for="review in profileStore.reviews"
                  :key="review._id"
                  class="rounded-xl bg-[--color-paper] p-4 border border-[--color-line]"
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
                  <p v-if="review.comment" class="text-sm text-[--color-ink]/70 mt-2">{{ review.comment }}</p>
                </div>
              </div>
              <p v-else class="text-sm text-[--color-ink]/55 mb-5">Todavía no hay reseñas para este perfil.</p>

              <form v-if="authStore.user?.role === 'client'" class="rounded-xl border border-[--color-line] p-4" @submit.prevent="handleCreateReview">
                <p class="font-medium text-sm mb-3">Deja tu reseña</p>
                <div class="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                  <select v-model.number="reviewScore" class="wp-input">
                    <option :value="5">5 estrellas</option>
                    <option :value="4">4 estrellas</option>
                    <option :value="3">3 estrellas</option>
                    <option :value="2">2 estrellas</option>
                    <option :value="1">1 estrella</option>
                  </select>
                  <input v-model="reviewComment" type="text" maxlength="500" class="wp-input" placeholder="Escribe un comentario (opcional)" />
                </div>
                <button type="submit" :disabled="isSavingReview" class="wp-btn-primary mt-3 disabled:opacity-50">
                  {{ isSavingReview ? 'Guardando...' : 'Publicar reseña' }}
                </button>
                <p v-if="reviewSuccess" class="mt-2 text-sm text-[--color-forest]">{{ reviewSuccess }}</p>
                <p v-if="reviewError" class="mt-2 text-sm text-[--color-clay]">{{ reviewError }}</p>
              </form>
              <p v-else class="text-xs text-[--color-ink]/50">Inicia sesión como cliente para dejar una reseña.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-[--color-line] flex items-center justify-between gap-4">
            <div>
              <span class="wp-label block">Tarifa por hora</span>
              <span class="wp-serif text-3xl font-semibold text-[--color-forest]">${{ perfilPaseador.tarifaHora.toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-2">
              <a
                :href="perfilPaseador.telefono ? `tel:${perfilPaseador.telefono}` : undefined"
                :class="{ 'pointer-events-none opacity-40': !perfilPaseador.telefono }"
                class="wp-btn-ghost"
              >
                Llamar
              </a>
              <button
                :disabled="!perfilPaseador.telefono"
                @click="() => { isPerfilModalOpen = false; if (perfilPaseador) handleContactar(perfilPaseador) }"
                class="wp-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {{ perfilPaseador.telefono ? `Contactar a ${perfilPaseador.nombre.split(' ')[0]}` : 'Sin teléfono disponible' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Public+Sans:wght@400;500;600&display=swap');

:root {
  --color-ink: #1E2B22;
  --color-paper: #FFFFFF;
  --color-forest: #3F5B46;
  --color-clay: #B15A34;
  --color-gold: #C99A46;
  --color-line: #D8CFB8;
}

.wp-root {
  background: #FFFFFF;
  color: var(--color-ink);
  font-family: 'Public Sans', ui-sans-serif, system-ui, sans-serif;
}

.wp-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }

.wp-card {
  background: #FFFFFF;
  border: 1px solid var(--color-line);
  border-radius: 1.25rem;
}

.wp-label {
  font-size: 0.7rem;
  color: rgba(30, 43, 34, 0.65);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.wp-tag {
  font-size: 0.78rem;
  padding: 0.3rem 0.7rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-line);
  color: rgba(30, 43, 34, 0.75);
}

.wp-tag-strong {
  border-color: var(--color-forest);
  color: var(--color-forest);
  font-weight: 600;
}

.wp-input {
  color: var(--color-ink);
  border: 1px solid var(--color-line);
  border-radius: 0.6rem;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  background: #FFFFFF;
}
.wp-input::placeholder { color: rgba(30, 43, 34, 0.55); }

.wp-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.4rem;
  border-radius: 0.75rem;
  background: var(--color-forest);
  color: #F6F2E9;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background-color 0.15s ease;
}
.wp-btn-primary:hover { background: #33473A; }

.wp-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-line);
  color: var(--color-ink);
  font-weight: 600;
  font-size: 0.85rem;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.wp-btn-ghost:hover { background: #F7F9F7; border-color: rgba(30,43,34,0.3); }
</style>