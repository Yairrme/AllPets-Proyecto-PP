<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePaseadoresStore } from '../../stores/paseadores'
import type { Paseador, BloqueHorario, TamanoMascota, Reserva } from '../../types/paseador'

const props = defineProps<{
  paseador: Paseador | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'reservado', reserva: Reserva): void
}>()

const store = usePaseadoresStore()

// Estado del formulario
const fecha = ref('')
const bloqueHorario = ref<BloqueHorario>('tarde')
const horaInicio = ref('16:00')
const duracionHoras = ref(1)
const nombreMascota = ref('')
const razaMascota = ref('')
const tamanoMascota = ref<TamanoMascota>('mediano')
const notas = ref('')

// Estado de confirmación/éxito
const guardando = ref(false)
const exito = ref(false)
const mensajeError = ref('')

// Fecha mínima (hoy)
const fechaMinima = computed(() => {
  return (new Date().toISOString().split('T')[0]) || ''
})

// Costo total en tiempo real
const costoTotal = computed(() => {
  if (!props.paseador) return 0
  return props.paseador.tarifaHora * duracionHoras.value
})

// Sincronizar bloque horario por defecto cuando cambia el paseador
watch(
  () => props.paseador,
  (newVal) => {
    if (newVal && newVal.horariosDisponibles.length > 0) {
      bloqueHorario.value = newVal.horariosDisponibles[0] || 'tarde'
      if (newVal.tamanosAceptados.length > 0) {
        tamanoMascota.value = newVal.tamanosAceptados[0] || 'mediano'
      }
    }
    // Set default date to tomorrow
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    fecha.value = (manana.toISOString().split('T')[0]) || ''
    exito.value = false
    mensajeError.value = ''
  },
  { immediate: true }
)

function handleSubmit() {
  if (!props.paseador) return

  if (!fecha.value || !nombreMascota.value.trim() || !razaMascota.value.trim()) {
    mensajeError.value = 'Por favor completa todos los campos obligatorios (*).'
    return
  }

  mensajeError.value = ''
  guardando.value = true

  // Simulamos un breve retardo de red para efecto premium
  setTimeout(() => {
    const nuevaReserva = store.crearReserva({
      paseadorId: props.paseador!.id,
      paseadorNombre: props.paseador!.nombre,
      paseadorFoto: props.paseador!.foto,
      fecha: fecha.value,
      bloqueHorario: bloqueHorario.value,
      horaInicio: horaInicio.value,
      duracionHoras: duracionHoras.value,
      nombreMascota: nombreMascota.value.trim(),
      razaMascota: razaMascota.value.trim(),
      tamanoMascota: tamanoMascota.value,
      costoTotal: costoTotal.value,
      notas: notas.value.trim(),
    })

    guardando.value = false
    exito.value = true

    setTimeout(() => {
      emit('reservado', nuevaReserva)
      emit('close')
      exito.value = false
      // Reset form
      nombreMascota.value = ''
      razaMascota.value = ''
      notas.value = ''
    }, 1500)
  }, 600)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && paseador"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      @click.self="emit('close')"
    >
      <div
        class="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col transform transition-all duration-300 scale-100"
      >
        <!-- Encabezado del Modal -->
        <div class="p-6 bg-gradient-to-r from-stone-900 via-zinc-900 to-stone-950 text-white rounded-t-3xl relative flex items-center gap-4 border-b border-stone-800">
          <img
            :src="paseador.foto"
            :alt="paseador.nombre"
            class="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/30 shadow-md"
          />
          <div class="flex-1">
            <span class="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              Reservar Paseo
            </span>
            <h2 class="text-xl font-extrabold mt-1 text-white">{{ paseador.nombre }}</h2>
            <p class="text-xs text-stone-300 font-medium mt-0.5">📍 {{ paseador.zona }} • ★ {{ paseador.calificacion }}</p>
          </div>
          <button
            @click="emit('close')"
            class="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Pantalla de Éxito / Confirmación -->
        <div v-if="exito" class="p-12 text-center flex flex-col items-center justify-center my-auto">
          <div class="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-4xl mb-4 border border-amber-500/20">
            🎉
          </div>
          <h3 class="text-2xl font-extrabold text-stone-900 dark:text-white mb-2">¡Reserva Confirmada!</h3>
          <p class="text-stone-600 dark:text-zinc-300 text-sm max-w-xs leading-relaxed">
            Hemos agendado el paseo de <strong class="text-amber-700 dark:text-amber-400">{{ nombreMascota }}</strong> con {{ paseador.nombre }}.
          </p>
        </div>

        <!-- Formulario de Reserva -->
        <form v-else @submit.prevent="handleSubmit" class="p-6 space-y-6">
          
          <!-- Mensaje de Error -->
          <div v-if="mensajeError" class="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs rounded-xl font-semibold flex items-center gap-2">
            <span>⚠️</span> {{ mensajeError }}
          </div>

          <!-- Paso 1: Cuándo será el paseo -->
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
              <span>📅</span> 1. Fecha y Horario
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Fecha del Paseo *</label>
                <input
                  v-model="fecha"
                  type="date"
                  :min="fechaMinima"
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Turno Disponible *</label>
                <select
                  v-model="bloqueHorario"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none capitalize"
                >
                  <option v-for="h in paseador.horariosDisponibles" :key="h" :value="h">
                    ☀️ Turno {{ h }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Hora exacta y Duración -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Hora estimada de inicio</label>
                <select
                  v-model="horaInicio"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="08:00">08:00 hs</option>
                  <option value="10:00">10:00 hs</option>
                  <option value="12:00">12:00 hs</option>
                  <option value="15:00">15:00 hs</option>
                  <option value="17:00">17:00 hs</option>
                  <option value="19:00">19:00 hs</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Duración del paseo</label>
                <div class="flex gap-2">
                  <button
                    v-for="h in [1, 2, 3]"
                    :key="h"
                    type="button"
                    @click="duracionHoras = h"
                    :class="[
                      'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
                      duracionHoras === h
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                    ]"
                  >
                    {{ h }} hr{{ h > 1 ? 's' : '' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Paso 2: Datos del perro -->
          <div class="pt-2 border-t border-stone-100 dark:border-zinc-800">
            <h3 class="text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
              <span>🐕</span> 2. Datos de tu Mascota
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Nombre de tu perro *</label>
                <input
                  v-model="nombreMascota"
                  type="text"
                  placeholder="Ej: Max, Luna..."
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Raza *</label>
                <input
                  v-model="razaMascota"
                  type="text"
                  placeholder="Ej: Golden Retriever, Mestizo..."
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="mt-3.5">
              <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Tamaño de la mascota</label>
              <div class="flex gap-2">
                <button
                  v-for="tam in ['pequeño', 'mediano', 'grande'] as const"
                  :key="tam"
                  type="button"
                  :disabled="!paseador.tamanosAceptados.includes(tam)"
                  @click="tamanoMascota = tam"
                  :class="[
                    'flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all',
                    !paseador.tamanosAceptados.includes(tam)
                      ? 'opacity-30 cursor-not-allowed bg-stone-100 dark:bg-zinc-800/40 text-stone-400'
                      : tamanoMascota === tam
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                  ]"
                >
                  {{ tam }}
                </button>
              </div>
            </div>

            <div class="mt-3.5">
              <label class="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Cuidados especiales o notas (opcional)</label>
              <textarea
                v-model="notas"
                rows="2"
                placeholder="Ej: Le gusta jugar con pelota, tira un poco de la correa..."
                class="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              ></textarea>
            </div>
          </div>

          <!-- Resumen de Costo en Vivo -->
          <div class="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span class="text-xs text-amber-800 dark:text-amber-300 font-bold block uppercase tracking-wider">Costo Total Estimado</span>
              <span class="text-xs text-stone-500 dark:text-zinc-400">{{ duracionHoras }} hr{{ duracionHoras > 1 ? 's' : '' }} × ${{ paseador.tarifaHora.toLocaleString() }}</span>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-amber-700 dark:text-amber-400">${{ costoTotal.toLocaleString() }} ARS</span>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="w-1/3 py-3 px-4 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 font-bold text-sm hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardando"
              class="flex-1 py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span v-if="guardando" class="animate-spin">⌛</span>
              <span>{{ guardando ? 'Agendando...' : 'Confirmar Reserva' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
