<!--
  ============================================================================
  ARCHIVO: components/paseadores/PaseadoresFilter.vue
  ROL EN LA ARQUITECTURA: Componente de Barra de Filtros Interactivos del Catálogo.
  ============================================================================
  Descripción general:
  Permite a los usuarios filtrar en tiempo real la lista de trabajadores mostrada
  en `PaseadoresView.vue` según dos criterios principales:
  1. Ciudad / Ubicación (`Cipolletti`, `Neuquén` o todas).
  2. Tipo de servicio / Rol (`walker` para Paseadores, `caregiver` para Cuidadores o todos).
  Se conecta directamente con `usePaseadoresStore` (Pinia) modificando su estado reactivo.
-->
<script setup lang="ts">
import { usePaseadoresStore } from '../../stores/paseadores'
import type { RolTrabajador } from '../../types/paseador'

// Instancia del store de paseadores que contiene los filtros reactivos y las zonas disponibles
const store = usePaseadoresStore()

/**
 * Actualiza la ciudad seleccionada en el store.
 * Si se pasa `''` (cadena vacía), se muestran los trabajadores de todas las ciudades.
 */
function seleccionarZona(zona: string) {
  store.filtros.zona = zona
}

/**
 * Actualiza el filtro de rol en el store ('walker', 'caregiver' o '' para ver ambos).
 */
function seleccionarRol(rol: RolTrabajador | '') {
  store.filtros.rol = rol
}
</script>

<script lang="ts">
export default {
  name: 'PaseadoresFilter',
}
</script>

<template>
  <!-- Sección contenedora de filtros dividida en 2 columnas en pantallas medianas/grandes -->
  <section class="wp-filter mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Filtro por Ciudad -->
      <div>
        <div class="flex items-center justify-between">
          <div>
            <p class="wp-label">Ubicación</p>
            <h2 class="wp-serif mt-0.5 text-lg font-semibold">¿Dónde estás?</h2>
          </div>

          <!-- Botón rápido para limpiar el filtro de ciudad cuando hay una seleccionada -->
          <button
            v-if="store.filtros.zona !== ''"
            @click="seleccionarZona('')"
            class="text-left text-xs font-semibold text-[--color-forest] hover:underline"
          >
            Ver todas las ciudades
          </button>
        </div>

        <!-- Píldoras (chips) de selección de ciudad -->
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            @click="seleccionarZona('')"
            :class="[
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
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
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              store.filtros.zona === zona
                ? 'border-[--color-forest] bg-[--color-forest] text-[--color-paper]'
                : 'border-[--color-line] bg-white text-[--color-ink]/70 hover:bg-[--color-paper]'
            ]"
          >
            <span>{{ zona }}</span>
          </button>
        </div>
      </div>

      <!-- Filtro entre Paseadores y Cuidadores -->
      <div>
        <div class="flex items-center justify-between">
          <div>
            <p class="wp-label">Servicio</p>
            <h2 class="wp-serif mt-0.5 text-lg font-semibold">¿Qué estás buscando?</h2>
          </div>

          <!-- Botón rápido para restablecer el filtro de rol cuando se filtró por uno específico -->
          <button
            v-if="store.filtros.rol !== ''"
            @click="seleccionarRol('')"
            class="text-left text-xs font-semibold text-[--color-forest] hover:underline"
          >
            Ver todos
          </button>
        </div>

        <!-- Píldoras (chips) de selección de tipo de trabajador -->
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            @click="seleccionarRol('')"
            :class="[
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              store.filtros.rol === ''
                ? 'border-[--color-forest] bg-[--color-forest] text-[--color-paper]'
                : 'border-[--color-line] bg-white text-[--color-ink]/70 hover:bg-[--color-paper]'
            ]"
          >
            Todos
          </button>

          <button
            @click="seleccionarRol('walker')"
            :class="[
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              store.filtros.rol === 'walker'
                ? 'border-[#E17100] bg-[#E17100] text-white'
                : 'border-[--color-line] bg-white text-[--color-ink]/70 hover:bg-[--color-paper]'
            ]"
          >
            🦮 Paseadores
          </button>

          <button
            @click="seleccionarRol('caregiver')"
            :class="[
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              store.filtros.rol === 'caregiver'
                ? 'border-[--color-forest] bg-[--color-forest] text-[--color-paper]'
                : 'border-[--color-line] bg-white text-[--color-ink]/70 hover:bg-[--color-paper]'
            ]"
          >
            🏠 Cuidadores
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wp-filter { border-bottom: 1px solid var(--color-line); padding-bottom: 1rem; }
.wp-label { color: rgba(30, 43, 34, 0.5); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; }
.wp-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
</style>
