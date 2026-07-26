<script setup lang="ts">
import type { Paseador } from '../../types/paseador'

defineProps<{
  paseador: Paseador
}>()

const emit = defineEmits<{
  (e: 'reservar', paseador: Paseador): void
  (e: 'ver-perfil', paseador: Paseador): void
}>()
</script>

<template>
  <div
    class="group relative bg-white/95 dark:bg-zinc-900 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
  >

    <!-- Foto de Perfil + Calificación flotante -->
    <div class="relative h-56 w-full overflow-hidden bg-stone-100 dark:bg-zinc-800">
      <img
        :src="paseador.foto"
        :alt="paseador.nombre"
        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
      
      <!-- Calificación -->
      <div
        class="absolute top-3 right-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs text-stone-900 dark:text-zinc-100 px-2.5 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-xs border border-stone-100 dark:border-zinc-800"
      >
        <span class="text-amber-500">★</span>
        <span>{{ paseador.calificacion }}</span>
        <span class="text-xs text-stone-500 dark:text-zinc-400 font-normal">({{ paseador.totalResenas }})</span>
      </div>

      <!-- Zona / Ubicación en el pie de la imagen -->
      <div class="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium drop-shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <span>{{ paseador.zona }}</span>
      </div>

      <!-- Experiencia en el pie derecho -->
      <div class="absolute bottom-3 right-3 text-xs bg-black/40 backdrop-blur-md text-amber-200 px-2.5 py-0.5 rounded-md border border-amber-400/30">
        {{ paseador.aniosExperiencia }} años exp.
      </div>
    </div>

    <!-- Contenido de la Tarjeta -->
    <div class="p-5 flex-1 flex flex-col justify-between">
      <div>
        <!-- Nombre y Tarifa -->
        <div class="flex justify-between items-start gap-2 mb-2">
          <h3 class="text-xl font-bold text-stone-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            {{ paseador.nombre }}
          </h3>
          <div class="text-right shrink-0">
            <span class="text-2xl font-black text-amber-700 dark:text-amber-400">${{ paseador.tarifaHora.toLocaleString() }}</span>
            <span class="text-xs text-stone-500 dark:text-zinc-400 block font-medium">/ hora</span>
          </div>
        </div>

        <!-- Biografía corta -->
        <p class="text-sm text-stone-600 dark:text-zinc-300 line-clamp-2 mb-4 font-normal leading-relaxed">
          {{ paseador.biografia }}
        </p>

        <!-- Insignias -->
        <div class="flex flex-wrap gap-1.5 mb-4">
          <span
            v-for="(badge, index) in paseador.insignias.slice(0, 3)"
            :key="index"
            class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200/80 dark:border-zinc-700/80"
          >
            <span v-if="badge === 'Verificado'" class="text-amber-600 dark:text-amber-400 font-bold">✓</span>
            {{ badge }}
          </span>
          <span
            v-if="paseador.insignias.length > 3"
            class="inline-flex items-center text-xs font-medium px-2 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400"
          >
            +{{ paseador.insignias.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="pt-3 border-t border-stone-100 dark:border-zinc-800 flex gap-2.5">
        <button
          @click="emit('ver-perfil', paseador)"
          class="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 text-sm font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 hover:border-stone-300 transition-all text-center"
        >
          Ver Perfil
        </button>
        <button
          @click="emit('reservar', paseador)"
          class="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 transform active:scale-95"
        >
          <span>Reservar</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
