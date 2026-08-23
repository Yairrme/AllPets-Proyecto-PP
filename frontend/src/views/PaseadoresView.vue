<script setup lang="ts">
import { ref } from 'vue'
import { usePaseadoresStore } from '../stores/paseadores'
import type { Paseador, Reserva } from '../types/paseador'

import PaseadorCard from '../components/paseadores/PaseadorCard.vue'
import PaseadoresFilter from '../components/paseadores/PaseadoresFilter.vue'
import ReservaModal from '../components/paseadores/ReservaModal.vue'
import MisReservasDrawer from '../components/paseadores/MisReservasDrawer.vue'

const store = usePaseadoresStore()

const selectedPaseador = ref<Paseador | null>(null)
const isModalOpen = ref(false)
const isDrawerOpen = ref(false)
const isPerfilModalOpen = ref(false)
const perfilPaseador = ref<Paseador | null>(null)

function handleOpenReserva(paseador: Paseador) {
  selectedPaseador.value = paseador
  isModalOpen.value = true
}

function handleVerPerfil(paseador: Paseador) {
  perfilPaseador.value = paseador
  isPerfilModalOpen.value = true
}

function onReservaCreada(reserva: Reserva) {
  // Cuando se crea la reserva, abrimos el cajón para que el usuario la vea de inmediato
  isDrawerOpen.value = true
}
</script>

<template>
  <div class="min-h-screen bg-stone-50/50 dark:bg-zinc-950 text-stone-800 dark:text-zinc-100 pb-24">
    <!-- Contenedor Principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      
      <!-- Hero Banner Minimalista y Elegante -->
      <div class="relative bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-950 rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden shadow-xl text-white border border-stone-800/80">
        <!-- Luces y efectos sutiles -->
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div class="max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
              Red de Cuidado AllPets
            </div>
            <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-white drop-shadow-xs">
              Encuentra el <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">Paseador Ideal</span> para tu Mascota
            </h1>
            <p class="text-stone-300 text-sm sm:text-base font-normal leading-relaxed mb-8">
              Explora nuestra red de paseadores verificados, calificados por la comunidad de dueños y apasionados por el bienestar animal. Reserva turnos flexibles con total confianza.
            </p>

            <!-- Estadísticas en línea minimalistas -->
            <div class="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <div class="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                <span class="text-amber-400 font-extrabold text-base">★ 4.9</span>
                <span class="text-stone-300">Valoración Promedio</span>
              </div>
              <div class="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                <span class="text-orange-400 font-extrabold text-base">🛡️ 100%</span>
                <span class="text-stone-300">Verificados</span>
              </div>
            </div>
          </div>

          <!-- Botón de Mis Reservas (CTA del Hero) -->
          <div class="w-full lg:w-auto flex flex-col items-stretch sm:items-end shrink-0">
            <button
              @click="isDrawerOpen = true"
              class="relative group bg-white text-stone-900 hover:bg-amber-50/80 px-6 py-4 rounded-2xl font-extrabold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 border border-stone-100 transform hover:-translate-y-0.5"
            >
              <span class="text-2xl"></span>
              <div class="text-left">
                <span class="text-base text-stone-900 font-black">Ver Mis Reservas</span>
              </div>
              <!-- Badge contador -->
              <span
                v-if="store.totalReservasActivas > 0"
                class="bg-amber-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-xs animate-pulse"
              >
                {{ store.totalReservasActivas }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros -->
      <PaseadoresFilter />

      <!-- Cabecera de Grilla y Contadores -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2.5">
            <span>Paseadores Disponibles</span>
            <span class="text-xs font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 px-3 py-0.5 rounded-full">
              {{ store.paseadoresFiltrados.length }}
            </span>
          </h2>
          <p class="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 font-medium">
            Tarifas transparentes por hora con cobertura en tu zona
          </p>
        </div>
      </div>

      <!-- Grilla de Tarjetas -->
      <div
        v-if="store.paseadoresFiltrados.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <PaseadorCard
          v-for="paseador in store.paseadoresFiltrados"
          :key="paseador.id"
          :paseador="paseador"
          @reservar="handleOpenReserva"
          @ver-perfil="handleVerPerfil"
        />
      </div>

      <!-- Estado Vacío minimalista y elegante -->
      <div
        v-else
        class="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 p-16 text-center max-w-xl mx-auto shadow-xs"
      >
        <div class="w-20 h-20 bg-stone-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 border border-stone-200 dark:border-zinc-700">
          🔍
        </div>
        <h3 class="text-xl font-bold text-stone-800 dark:text-white mb-2">
          No hay paseadores en esta ciudad
        </h3>
        <p class="text-sm text-stone-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Actualmente no contamos con paseadores disponibles en la zona seleccionada. ¡Prueba seleccionando otra ciudad o explorando toda nuestra red!
        </p>
        <button
          @click="store.resetFiltros"
          class="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
        >
           Mostrar todas las ciudades
        </button>
      </div>

    </div>

    <!-- Modales y Cajones -->
    <ReservaModal
      :paseador="selectedPaseador"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @reservado="onReservaCreada"
    />

    <MisReservasDrawer
      :is-open="isDrawerOpen"
      @close="isDrawerOpen = false"
    />

    <!-- Modal de Ver Perfil Completo -->
    <Teleport to="body">
      <div
        v-if="isPerfilModalOpen && perfilPaseador"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
        @click.self="isPerfilModalOpen = false"
      >
        <div class="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 flex flex-col">
          <div class="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-zinc-800 pb-6 mb-6">
            <div class="flex items-center gap-4">
              <img
                :src="perfilPaseador.foto"
                :alt="perfilPaseador.nombre"
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-sm border border-stone-200 dark:border-zinc-700"
              />
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-2xl font-black text-stone-900 dark:text-white">{{ perfilPaseador.nombre }}</h3>
                  <span v-if="perfilPaseador.destacado" class="text-amber-500 text-lg" title="Destacado"></span>
                </div>
                <p class="text-sm font-semibold text-amber-700 dark:text-amber-400">Zona de cobertura: {{ perfilPaseador.zona }}</p>
                <div class="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400 mt-1">
                  <span>★ <strong class="text-stone-800 dark:text-zinc-200">{{ perfilPaseador.calificacion }}</strong> ({{ perfilPaseador.totalResenas }} reseñas)</span>
                  <span>•</span>

                </div>
              </div>
            </div>
            <button
              @click="isPerfilModalOpen = false"
              class="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-800 dark:hover:text-white font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Cuerpo del perfil -->
          <div class="space-y-6">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">Sobre mí</h4>
              <p class="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed bg-stone-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800">
                {{ perfilPaseador.biografia }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">Especialidades de Paseo</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="esp in perfilPaseador.especialidades"
                    :key="esp"
                    class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                  >
                    🐾 {{ esp }}
                  </span>
                </div>
              </div>

              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">Insignias y Verificaciones</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="ins in perfilPaseador.insignias"
                    :key="ins"
                    class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 flex items-center gap-1"
                  >
                    <span>🛡️</span> {{ ins }}
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">Días Disponibles</h4>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="dia in perfilPaseador.diasDisponibles"
                    :key="dia"
                    class="text-xs px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium"
                  >
                    {{ dia }}
                  </span>
                </div>
              </div>

              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">Tamaños Aceptados</h4>
                <div class="flex gap-2">
                  <span
                    v-for="tam in perfilPaseador.tamanosAceptados"
                    :key="tam"
                    class="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                  >
                    {{ tam }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer del perfil con tarifa y acción -->
          <div class="mt-8 pt-6 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span class="text-xs text-stone-400 font-bold block uppercase tracking-wider">Tarifa Oficial</span>
              <span class="text-3xl font-black text-amber-700 dark:text-amber-400">${{ perfilPaseador.tarifaHora.toLocaleString() }} <small class="text-sm font-normal text-stone-500">/ hora</small></span>
            </div>
            <button
              @click="isPerfilModalOpen = false; handleOpenReserva(perfilPaseador!)"
              class="py-3 px-8 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-md transition-all"
            >
              🚀 Reservar con {{ perfilPaseador.nombre.split(' ')[0] }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
