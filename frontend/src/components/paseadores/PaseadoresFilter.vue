<script setup lang="ts">
import { usePaseadoresStore } from '../../stores/paseadores'

const store = usePaseadoresStore()

function seleccionarZona(zona: string) {
  store.resetFiltros()
  store.filtros.zona = zona
}
</script>

<template>
  <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-xs p-6 mb-10 transition-all">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-2.5 text-sm sm:text-base font-extrabold text-stone-800 dark:text-zinc-200">
        <span class="text-lg"> Zona de Cobertura</span>
      </div>

      <button
        v-if="store.filtros.zona !== ''"
        @click="seleccionarZona('')"
        class="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 transition-all"
      >
        <span>🔄 Mostrar todas las ciudades</span>
      </button>
    </div>

    <!-- Píldoras de Ciudades / Zonas -->
    <div class="mt-4 flex items-center gap-2.5 flex-wrap">
      <button
        @click="seleccionarZona('')"
        :class="[
          'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5',
          store.filtros.zona === ''
            ? 'bg-amber-600 text-white shadow-xs scale-105'
            : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
        ]"
      >
        <span>Todo</span>
      </button>

      <button
        v-for="zona in store.zonasDisponibles"
        :key="zona"
        @click="seleccionarZona(zona)"
        :class="[
          'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5',
          store.filtros.zona === zona
            ? 'bg-stone-900 dark:bg-amber-500 text-white shadow-xs scale-105'
            : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
        ]"
      >
        <span>📍 {{ zona }}</span>
      </button>
    </div>
  </div>
</template>
