<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePaseadoresStore } from '../stores/paseadores'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import type { Paseador } from '../types/paseador'
import { formatARS } from '../utils/currency'
import { useContactarPaseador } from '../composables/useContactarPaseador'
import { scrollToSection } from '../utils/scroll'
import { onAvatarError } from '../utils/paseador'

import PaseadorCard from '../components/paseadores/PaseadorCard.vue'
import PaseadoresFilter from '../components/paseadores/PaseadoresFilter.vue'
import PaseadoresHero from '../components/paseadores/PaseadoresHero.vue'
import dogLeashImg from '../assets/dog-leash.jpg'

const route = useRoute()
const store = usePaseadoresStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()

// Los enlaces del header y el buscador llegan como ?rol=walker|caregiver y ?q=texto
watch(
  () => [route.query.rol, route.query.q],
  () => {
    const rol = route.query.rol
    store.setFiltros({
      rol: rol === 'walker' || rol === 'caregiver' ? rol : '',
      busqueda: typeof route.query.q === 'string' ? route.query.q : '',
    })
  },
  { immediate: true },
)

// Los filtros se aplican en la API. Se espera un instante para no consultar por
// cada tecla del buscador ni por cada cambio seguido de filtros.
let filtroTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => store.filtros,
  () => {
    clearTimeout(filtroTimer)
    filtroTimer = setTimeout(() => store.fetchPaseadores(), 300)
  },
  { deep: true },
)
onBeforeUnmount(() => clearTimeout(filtroTimer))

onMounted(async () => {
  await store.fetchPaseadores()
  // "Ver perfil" desde la página de inicio: /paseadores?perfil=<id>
  const perfilId = route.query.perfil
  if (typeof perfilId === 'string') {
    const paseador = await store.fetchPaseador(perfilId)
    if (paseador) handleVerPerfil(paseador)
  }
  // Llegada desde el header (#servicios, #quienes-somos): el listado ya cargó,
  // así que se vuelve a ubicar la sección en su posición definitiva.
  if (route.hash) {
    await nextTick()
    scrollToSection(route.hash)
  }
})

const selectedPaseador = ref<Paseador | null>(null)
const isPerfilModalOpen = ref(false)
const perfilPaseador = ref<Paseador | null>(null)
const selectedGalleryImage = ref<string | null>(null)
const reviewScore = ref(5)
const reviewComment = ref('')
const reviewError = ref('')
const reviewSuccess = ref('')
const isSavingReview = ref(false)

const { contactar, contactError } = useContactarPaseador()
// null: sin sesión o todavía cargando · '': no disponible
const perfilTelefono = ref<string | null>(null)

function handleContactar(paseador: Paseador) {
  selectedPaseador.value = paseador
  contactar(paseador)
}

/** El teléfono solo se entrega con sesión: no viene en el directorio público. */
async function cargarTelefonoPerfil(paseador: Paseador) {
  perfilTelefono.value = null
  if (!authStore.isAuthenticated) return
  const telefono = paseador.disponible
    ? await profileStore.fetchCaregiverContact(paseador.id).catch(() => null)
    : null
  // Si mientras tanto se abrió otro perfil, esta respuesta ya no corresponde.
  if (perfilPaseador.value?.id === paseador.id) perfilTelefono.value = telefono ?? ''
}

function handleVerPerfil(paseador: Paseador) {
  perfilPaseador.value = paseador
  selectedGalleryImage.value = null
  isPerfilModalOpen.value = true
  cargarTelefonoPerfil(paseador)
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
    const updated = await store.fetchPaseador(perfilPaseador.value.id)
    if (updated) {
      perfilPaseador.value = updated
    }
  } catch (error: any) {
    reviewError.value = error.message || 'No se pudo guardar la reseña.'
  } finally {
    isSavingReview.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white text-(--color-ink) pb-24 wp-root">

    <div class="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 pt-10">

      <!-- Marca -->
      <div class="flex items-baseline justify-between mb-10">
        
      </div>

      <!-- Hero (compartido con la página de inicio) -->
      <PaseadoresHero :show-location="false" />

      <!-- Servicios: filtros y listado (destino de "Servicios" en el header) -->
      <section id="servicios">
      <!-- Filtros -->
      <PaseadoresFilter />

      <p v-if="contactError" role="alert" class="mb-4 text-sm text-red-600">{{ contactError }}</p>

      <!-- Cabecera de listado -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mt-10 mb-8">
        <h2 class="wp-serif text-2xl sm:text-3xl font-semibold">
          {{ store.filtros.rol === 'walker' ? 'Paseadores disponibles' : store.filtros.rol === 'caregiver' ? 'Cuidadores disponibles' : 'Paseadores y cuidadores disponibles' }}
          <span class="wp-serif text-lg text-(--color-ink)/40 font-normal">— {{ store.total }}</span>
        </h2>
        <p class="text-xs sm:text-sm text-(--color-ink)/50">
          Tarifas por hora, sin sorpresas
        </p>
      </div>

      <!-- Estado de carga -->
      <div
        v-if="store.isLoading"
        class="wp-card p-14 text-center max-w-lg mx-auto mt-4 animate-pulse"
      >
        <div class="w-10 h-10 border-3 border-(--color-forest) border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 class="wp-serif text-lg font-semibold mb-1">Cargando paseadores...</h3>
        <p class="text-sm text-(--color-ink)/60">Consultando paseadores y cuidadores disponibles.</p>
      </div>

      <!-- Error de conexión (antes se mostraba como "no hay paseadores") -->
      <div
        v-else-if="store.error"
        role="alert"
        class="wp-card p-10 text-center max-w-lg mx-auto mt-4"
      >
        <h3 class="wp-serif text-lg font-semibold mb-2">No pudimos cargar el listado</h3>
        <p class="text-sm text-(--color-ink)/60 mb-6">{{ store.error }}</p>
        <button class="wp-btn-primary" @click="store.fetchPaseadores()">Reintentar</button>
      </div>

      <!-- Grilla -->
      <template v-else-if="store.paseadores.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PaseadorCard
            v-for="paseador in store.paseadores"
            :key="paseador.id"
            :paseador="paseador"
            @contactar="handleContactar"
            @ver-perfil="handleVerPerfil"
          />
        </div>
        <div v-if="store.hayMas" class="mt-10 text-center">
          <button
            type="button"
            class="wp-btn-ghost disabled:opacity-50"
            :disabled="store.isLoadingMore"
            @click="store.fetchMas()"
          >
            {{ store.isLoadingMore ? 'Cargando...' : 'Ver más' }}
          </button>
        </div>
      </template>

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
          No hay paseadores disponibles
        </h3>
        <p class="text-sm text-(--color-ink)/60 mb-7 leading-relaxed">
          No encontramos paseadores con los filtros seleccionados o registrados en la zona actualmente.
        </p>
        <button
          @click="store.resetFiltros"
          class="wp-btn-primary"
        >
          Mostrar todas las ciudades
        </button>
      </div>

      </section>

      <!-- Quiénes somos (destino de "Quiénes somos" en el header) -->
      <section id="quienes-somos" class="mt-20 pt-14 border-t border-(--color-line) space-y-16">
        <div>
          <div class="max-w-2xl mb-10">
            <span class="wp-label">Transparencia y confianza</span>
            <h2 class="wp-serif text-3xl font-semibold mt-1">
              ¿Por qué elegir paseadores y cuidadores en AllPets?
            </h2>
            <p class="text-sm sm:text-base text-(--color-ink)/70 mt-2">
              Conectamos dueños de mascotas con paseadores y cuidadores locales en Cipolletti y Neuquén de forma directa, sin comisiones ocultas.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="wp-card p-6">
              <div class="w-10 h-10 rounded-xl bg-(--color-forest)/10 text-(--color-forest) flex items-center justify-center font-bold mb-4">
                ✓
              </div>
              <h3 class="wp-serif text-lg font-semibold mb-2">Perfiles y permisos verificables</h3>
              <p class="text-sm text-(--color-ink)/70 leading-relaxed">
                Consultá fotos reales, años de experiencia, certificaciones y comprobantes de permisos municipales antes de contratar.
              </p>
            </div>

            <div class="wp-card p-6">
              <div class="w-10 h-10 rounded-xl bg-(--color-gold)/15 text-(--color-clay) flex items-center justify-center font-bold mb-4">
                ★
              </div>
              <h3 class="wp-serif text-lg font-semibold mb-2">Reseñas de clientes reales</h3>
              <p class="text-sm text-(--color-ink)/70 leading-relaxed">
                Leé las calificaciones y experiencias de otros vecinos de tu ciudad y dejá tu valoración después de cada paseo o estadía.
              </p>
            </div>

            <div class="wp-card p-6">
              <div class="w-10 h-10 rounded-xl bg-(--color-forest)/10 text-(--color-forest) flex items-center justify-center font-bold mb-4">
                💬
              </div>
              <h3 class="wp-serif text-lg font-semibold mb-2">Trato Directo por WhatsApp</h3>
              <p class="text-sm text-(--color-ink)/70 leading-relaxed">
                Acordá horarios, punto de encuentro y cuidados especiales hablando directamente con el paseador o cuidador elegido.
              </p>
            </div>
          </div>
        </div>

        <!-- Beneficios de pasear a tus mascotas o dejarlas con cuidadores + Foto -->
        <div class="pt-12 border-t border-(--color-line) grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          <div class="space-y-6">
            <div>
              <span class="wp-label">Bienestar animal</span>
              <h3 class="wp-serif text-2xl sm:text-3xl font-semibold mt-1">
                Beneficios de pasear a tus mascotas o dejarlas con cuidadores
              </h3>
              <p class="text-sm sm:text-base text-(--color-ink)/70 mt-2 leading-relaxed">
                Mantener una rutina activa y acompañada mejora la salud física y emocional de tu mascota cuando tenés horarios exigentes o salís de viaje.
              </p>
            </div>

            <div class="space-y-4">
              <div class="flex items-start gap-4 border-b border-(--color-line) pb-4">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E17100]/15 text-[#E17100] font-bold text-sm mt-0.5">🦮</span>
                <div>
                  <h4 class="font-semibold text-base text-(--color-ink)">Menos estrés y mejor salud física</h4>
                  <p class="text-sm text-(--color-ink)/70 mt-0.5 leading-relaxed">
                    Los paseos diarios canalizan su energía, previenen el sobrepeso, reducen la ansiedad en casa y estimulan su socialización.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-4 border-b border-(--color-line) pb-4">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-forest)/15 text-(--color-forest) font-bold text-sm mt-0.5">🏠</span>
                <div>
                  <h4 class="font-semibold text-base text-(--color-ink)">Cuidado en un ambiente hogareño y sin jaulas</h4>
                  <p class="text-sm text-(--color-ink)/70 mt-0.5 leading-relaxed">
                    Al dejarlos con un cuidador verificado, reciben atención personalizada, mantienen sus horarios de comida y descansan como en casa.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-gold)/20 text-(--color-clay) font-bold text-sm mt-0.5">♥</span>
                <div>
                  <h4 class="font-semibold text-base text-(--color-ink)">Compañía segura y tranquilidad para vos</h4>
                  <p class="text-sm text-(--color-ink)/70 mt-0.5 leading-relaxed">
                    Evitás que pasen largas horas solos y podés recibir fotos o novedades en tiempo real directamente en tu WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Imagen del perro con la correa -->
          <div class="flex items-center justify-center bg-white rounded-3xl border border-(--color-line) p-4 sm:p-6 overflow-hidden">
            <img
              :src="dogLeashImg"
              alt="Perro sosteniendo su correa listo para pasear"
              class="w-full max-h-[380px] object-contain"
            />
          </div>
        </div>
      </section>

    </div>

    <!-- Modal de perfil -->
    <Teleport to="body">
      <div
        v-if="isPerfilModalOpen && perfilPaseador"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-(--color-ink)/50 backdrop-blur-[2px]"
        @click.self="isPerfilModalOpen = false"
      >
        <div class="wp-card max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-10 flex flex-col">

          <!-- Encabezado -->
          <div class="flex items-start justify-between gap-4 border-b border-(--color-line) pb-6 mb-6">
            <div class="flex items-center gap-5">
              <img
                :src="perfilPaseador.foto"
                :alt="perfilPaseador.nombre"
                @error="onAvatarError"
                class="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-(--color-line) shadow-xs"
              />
              <div>
                <h3 class="wp-serif text-2xl sm:text-3xl font-semibold">{{ perfilPaseador.nombre }}</h3>
                <div class="flex flex-wrap items-center gap-2 mt-0.5">
                  <p class="text-sm text-(--color-forest) font-medium">{{ perfilPaseador.zona || 'Cipolletti' }}</p>
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
                      perfilPaseador.disponible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700',
                    ]"
                  >
                    <span
                      :class="['h-1.5 w-1.5 rounded-full', perfilPaseador.disponible ? 'bg-emerald-600' : 'bg-stone-500']"
                      aria-hidden="true"
                    />
                    {{ perfilPaseador.disponible ? 'Disponible' : 'No disponible por ahora' }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-(--color-ink)/55 mt-1.5">
                  <span class="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#C99A46"><path d="M12 2l2.9 6.26 6.9.6-5.2 4.6 1.6 6.76L12 16.9l-6.2 3.32 1.6-6.76-5.2-4.6 6.9-.6z"/></svg>
                    {{ perfilPaseador.totalResenas > 0 ? perfilPaseador.calificacion : 'Nuevo' }}
                  </span>
                  <span class="text-(--color-ink)/25">·</span>
                  <span>{{ perfilPaseador.totalResenas }} reseñas</span>
                  <span class="text-(--color-ink)/25">·</span>
                  <span>{{ perfilPaseador.aniosExperiencia }} {{ perfilPaseador.aniosExperiencia === 1 ? 'año' : 'años' }} de exp.</span>
                  <span class="text-(--color-ink)/25">·</span>
                  <span class="font-medium text-(--color-forest)">{{ perfilTelefono || (authStore.isAuthenticated ? 'Teléfono no disponible' : 'Iniciá sesión para ver el teléfono') }}</span>
                </div>
              </div>
            </div>
            <button
              @click="isPerfilModalOpen = false"
              class="w-9 h-9 shrink-0 rounded-lg border border-(--color-line) text-(--color-ink)/50 hover:text-(--color-ink) hover:border-(--color-ink)/30 transition-colors"
            >
              ✕
            </button>
          </div>

          <div class="space-y-7">
            <div>
              <h4 class="wp-label mb-2">Sobre mí</h4>
              <p class="text-sm sm:text-base text-(--color-ink)/75 leading-relaxed">
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
                <h4 class="wp-label mb-2">Certificaciones y permisos</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="ins in perfilPaseador.insignias" :key="ins" class="wp-tag wp-tag-strong">
                    ✓ {{ ins }}
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
                  <span v-for="tam in perfilPaseador.tamanosAceptados" :key="tam" class="wp-tag wp-tag-strong capitalize">
                    {{ tam }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Galería de Fotos -->
            <div class="border-t border-(--color-line) pt-6">
              <h4 class="wp-label mb-3">Galería de fotos</h4>
              <div
                v-if="perfilPaseador.galeriaFotos && perfilPaseador.galeriaFotos.length > 0"
                class="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                <button
                  v-for="(fotoUrl, idx) in perfilPaseador.galeriaFotos"
                  :key="idx"
                  type="button"
                  @click="selectedGalleryImage = fotoUrl"
                  class="aspect-[4/3] rounded-xl overflow-hidden border border-(--color-line) group relative focus:outline-none shadow-2xs"
                >
                  <img
                    :src="fotoUrl"
                    :alt="`Foto ${idx + 1} de ${perfilPaseador.nombre}`"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              </div>
              <p v-else class="text-sm text-(--color-ink)/55">
                Este trabajador todavía no ha subido fotos a su galería.
              </p>

              <!-- Vista ampliada de foto seleccionada -->
              <div
                v-if="selectedGalleryImage"
                class="mt-4 relative rounded-2xl overflow-hidden border border-(--color-line) bg-black/5"
              >
                <img
                  :src="selectedGalleryImage"
                  alt="Foto ampliada"
                  class="max-h-[500px] w-full object-contain bg-stone-950/90"
                />
                <button
                  type="button"
                  @click="selectedGalleryImage = null"
                  class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-(--color-ink) text-xs font-bold shadow hover:bg-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Reseñas -->
            <div class="border-t border-(--color-line) pt-6">
              <h4 class="wp-label mb-3">Reseñas de clientes</h4>

              <div v-if="profileStore.reviews.length" class="space-y-3 mb-5">
                <div
                  v-for="review in profileStore.reviews"
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
              <p v-else class="text-sm text-(--color-ink)/55 mb-5">Todavía no hay reseñas para este perfil.</p>

              <form v-if="authStore.user?.role === 'client'" class="rounded-xl border border-(--color-line) p-4" @submit.prevent="handleCreateReview">
                <p class="font-medium text-sm mb-3">Dejá tu reseña</p>
                <div class="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                  <select v-model.number="reviewScore" class="wp-input">
                    <option :value="5">5 estrellas</option>
                    <option :value="4">4 estrellas</option>
                    <option :value="3">3 estrellas</option>
                    <option :value="2">2 estrellas</option>
                    <option :value="1">1 estrella</option>
                  </select>
                  <input v-model="reviewComment" type="text" maxlength="500" class="wp-input" placeholder="Escribí un comentario (opcional)" />
                </div>
                <button type="submit" :disabled="isSavingReview" class="wp-btn-primary mt-3 disabled:opacity-50">
                  {{ isSavingReview ? 'Guardando...' : 'Publicar reseña' }}
                </button>
                <p v-if="reviewSuccess" class="mt-2 text-sm text-(--color-forest)">{{ reviewSuccess }}</p>
                <p v-if="reviewError" class="mt-2 text-sm text-(--color-clay)">{{ reviewError }}</p>
              </form>
              <p v-else class="text-xs text-(--color-ink)/50">Iniciá sesión como cliente para dejar una reseña.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-(--color-line) flex items-center justify-between gap-4">
            <div>
              <span class="wp-label block">Tarifa por hora</span>
              <span class="wp-serif text-3xl font-semibold text-(--color-forest)">{{ formatARS(perfilPaseador.tarifaHora) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <a
                :href="perfilTelefono && perfilPaseador.disponible ? `tel:${perfilTelefono}` : undefined"
                :class="{ 'pointer-events-none opacity-40': !perfilTelefono || !perfilPaseador.disponible }"
                class="wp-btn-ghost"
              >
                Llamar
              </a>
              <button
                :disabled="perfilTelefono === '' || !perfilPaseador.disponible"
                @click="() => { isPerfilModalOpen = false; if (perfilPaseador) handleContactar(perfilPaseador) }"
                class="wp-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {{
                  !perfilPaseador.disponible
                    ? 'No toma clientes por ahora'
                    : !authStore.isAuthenticated
                      ? 'Iniciá sesión para contactar'
                      : perfilTelefono === ''
                        ? 'Sin teléfono disponible'
                        : `Contactar a ${perfilPaseador.nombre.split(' ')[0]}`
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>

/* Las variables --color-* se definen en main.css (las comparte la página de inicio). */
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