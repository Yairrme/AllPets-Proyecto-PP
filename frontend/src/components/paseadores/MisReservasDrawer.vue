<script setup lang="ts">
import { usePaseadoresStore } from '../../stores/paseadores'
import type { EstadoReserva } from '../../types/paseador'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = usePaseadoresStore()

function getEstadoClase(estado: EstadoReserva) {
  switch (estado) {
    case 'confirmada':
      return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20'
    case 'pendiente':
      return 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/20'
    case 'completada':
      return 'bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-300 dark:border-zinc-700'
    case 'cancelada':
      return 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/20'
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
      @click="emit('close')"
    ></div>

    <!-- Panel Lateral / Drawer -->
    <div
      :class="[
        'fixed inset-y-0 right-0 z-50 max-w-md w-full bg-white dark:bg-zinc-900 shadow-2xl border-l border-stone-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <!-- Cabecera del Panel -->
      <div class="p-6 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between bg-stone-50 dark:bg-zinc-900/50">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl"></span>
          <div>
            <h2 class="text-lg font-extrabold text-stone-900 dark:text-white">Mis Reservas de Paseo</h2>
            <p class="text-xs text-stone-500 dark:text-zinc-400">
              {{ store.totalReservasActivas }} reserva{{ store.totalReservasActivas !== 1 ? 's' : '' }} activa{{ store.totalReservasActivas !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all font-bold"
        >
          ✕
        </button>
      </div>

      <!-- Lista de Reservas -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        
        <!-- Estado Vacío -->
        <div
          v-if="store.reservas.length === 0"
          class="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400"
        >
          <div class="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mb-4 border border-stone-200 dark:border-zinc-700">
            
          </div>
          <h3 class="text-base font-bold text-stone-700 dark:text-zinc-200 mb-1">Sin reservas registradas</h3>
          <p class="text-xs max-w-xs leading-relaxed text-stone-500 dark:text-zinc-400">
            Aún no has agendado paseos. ¡Explora nuestro catálogo y programa el primer recorrido para tu mascota!
          </p>
        </div>

        <!-- Tarjetas de Reserva -->
        <div
          v-for="reserva in store.reservas"
          :key="reserva.id"
          class="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/80 flex flex-col gap-3 transition-all hover:border-amber-500/40"
        >
          <!-- Encabezado de la Reserva -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <img
                :src="reserva.paseadorFoto"
                :alt="reserva.paseadorNombre"
                class="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-zinc-700"
              />
              <div>
                <h4 class="font-bold text-sm text-stone-900 dark:text-white">{{ reserva.paseadorNombre }}</h4>
                <p class="text-xs text-stone-500 dark:text-zinc-400"> {{ reserva.fecha }} • {{ reserva.horaInicio }} hs</p>
              </div>
            </div>
            
            <span
              :class="['text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border', getEstadoClase(reserva.estado)]"
            >
              {{ reserva.estado }}
            </span>
          </div>

          <!-- Detalles de la Mascota y Costo -->
          <div class="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-stone-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-stone-700 dark:text-zinc-300">🐶 {{ reserva.nombreMascota }}</span>
              <span class="text-stone-400 block">{{ reserva.razaMascota }} ({{ reserva.tamanoMascota }})</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-amber-700 dark:text-amber-400 block">${{ reserva.costoTotal.toLocaleString() }}</span>
              <span class="text-[10px] text-stone-400">{{ reserva.duracionHoras }} hr{{ reserva.duracionHoras > 1 ? 's' : '' }}</span>
            </div>
          </div>

          <!-- Notas si existen -->
          <div v-if="reserva.notas" class="text-[11px] text-stone-500 dark:text-zinc-400 italic bg-stone-100/80 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-stone-200/50 dark:border-zinc-700/50">
            "{{ reserva.notas }}"
          </div>

          <!-- Botón de Cancelación (sólo si está activa o pendiente) -->
          <div
            v-if="reserva.estado === 'confirmada' || reserva.estado === 'pendiente'"
            class="flex justify-end pt-1"
          >
            <button
              @click="store.cancelarReserva(reserva.id)"
              class="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1 transition-all"
            >
              <span>✕ Cancelar reserva</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Pie del Panel -->
      <div class="p-4 border-t border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/50 text-center">
        <p class="text-xs text-stone-500 dark:text-zinc-400">
          ¿Dudas sobre tu paseo? Contacta a soporte o directamente a tu paseador en el chat de AllPets.
        </p>
      </div>
    </div>
  </Teleport>
</template>
