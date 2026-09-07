<script setup lang="ts">
import { usePaseadoresStore } from '../../stores/paseadores'

const store = usePaseadoresStore()

function seleccionarZona(zona: string) {
  store.resetFiltros()
  store.filtros.zona = zona
}
</script>

<script lang="ts">
export default {
  name: 'PaseadoresFilter',
}
</script>

<template>
  <section class="wp-filter mb-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="wp-label">Ubicación</p>
        <h2 class="wp-serif mt-0.5 text-lg font-semibold">¿Dónde estás?</h2>
      </div>

      <button
        v-if="store.filtros.zona !== ''"
        @click="seleccionarZona('')"
        class="text-left text-xs font-semibold text-[--color-forest] hover:underline"
      >
        Ver todas las ciudades
      </button>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        @click="seleccionarZona('')"
        :class="[
          'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
          store.filtros.zona === ''
            ? 'border-[--color-forest] bg-[--color-forest] text-[--color-paper]'
            : 'border-[--color-line] bg-white text-[--color-ink]/70 hover:bg-[--color-paper]'
        ]"
      >
        Todas las ciudades
      </button>

      <button
        v-for="zona in store.zonasDisponibles"
        :key="zona"
        @click="seleccionarZona(zona)"
        :class="[
          'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
          store.filtros.zona === zona
            ? 'border-[--color-forest] bg-[--color-forest] text-[--color-paper]'
            : 'border-[--color-line] bg-white text-[--color-ink]/70 hover:bg-[--color-paper]'
        ]"
      >
        <span>{{ zona }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.wp-filter { border-bottom: 1px solid var(--color-line); padding-bottom: 1rem; }
.wp-label { color: rgba(30, 43, 34, 0.5); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; }
.wp-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
</style>
