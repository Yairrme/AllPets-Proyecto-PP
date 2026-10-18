<script setup lang="ts">
import type { Paseador } from '../../types/paseador'

defineProps<{
  paseador: Paseador
}>()

const emit = defineEmits<{
  (e: 'contactar', paseador: Paseador): void
  (e: 'ver-perfil', paseador: Paseador): void
}>()
</script>

<script lang="ts">
export default {
  name: 'PaseadorCard',
}
</script>

<template>
  <article
    :class="[
      'group flex h-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg',
      paseador.rol === 'walker' ? 'wp-card-walker' : 'wp-card',
    ]"
  >

    <!-- Foto de Perfil + Calificación flotante -->
    <div class="relative h-72 sm:h-80 overflow-hidden bg-[--color-line]">
      <img
        :src="paseador.foto"
        :alt="paseador.nombre"
        @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }"
        class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <!-- Etiqueta de Rol (Paseador / Cuidador) -->
      <div
        :class="[
          'absolute left-3 top-3 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-xs',
          paseador.rol === 'walker'
            ? 'bg-[#E17100] text-white'
            : 'bg-[--color-forest] text-[--color-paper]',
        ]"
      >
        {{ paseador.rol === 'walker' ? '🦮 Paseador' : '🏠 Cuidador' }}
      </div>
      
      <!-- Calificación -->
      <div
        class="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-[--color-paper]/95 px-2.5 py-1 text-sm font-semibold text-[--color-ink]"
      >
        <span class="text-amber-500">★</span>
        <span>{{ paseador.calificacion }}</span>
        <span class="text-xs font-normal text-[--color-ink]/55">({{ paseador.totalResenas }})</span>
      </div>

      <!-- Zona / Ubicación en el pie de la imagen -->
      <div class="absolute bottom-3 left-3 flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <span>{{ paseador.zona }}</span>
      </div>
    </div>

    <!-- Contenido de la Tarjeta -->
    <div class="flex flex-1 flex-col justify-between p-5">
      <div>
        <!-- Nombre y Tarifa -->
        <div class="flex items-start justify-between gap-4 mb-2">
          <h3
            :class="[
              'wp-serif text-xl font-semibold',
              paseador.rol === 'walker' ? 'text-white' : 'text-[--color-ink]',
            ]"
          >
            {{ paseador.nombre }}
          </h3>
          <div class="text-right shrink-0">
            <span
              :class="[
                'wp-serif text-xl font-semibold',
                paseador.rol === 'walker' ? 'text-white' : 'text-[--color-forest]',
              ]"
            >
              ${{ paseador.tarifaHora.toLocaleString() }}
            </span>
            <span
              :class="[
                'block text-xs',
                paseador.rol === 'walker' ? 'text-white/80' : 'text-[--color-ink]/50',
              ]"
            >
              por hora
            </span>
          </div>
        </div>

        <!-- Biografía corta -->
        <p
          :class="[
            'mb-4 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed',
            paseador.rol === 'walker' ? 'text-white/95' : 'text-[--color-ink]/70',
          ]"
        >
          {{ paseador.biografia }}
        </p>

        <!-- Insignias -->
        <div class="mb-4 flex min-h-7 flex-wrap gap-1.5">
          <span
            v-for="(badge, index) in paseador.insignias.slice(0, 3)"
            :key="index"
            :class="paseador.rol === 'walker' ? 'wp-tag-walker' : 'wp-tag'"
          >
            <span
              v-if="badge === 'Verificado'"
              :class="paseador.rol === 'walker' ? 'font-bold text-white' : 'font-bold text-[--color-clay]'"
            >✓</span>
            {{ badge }}
          </span>
          <span
            v-if="paseador.insignias.length > 3"
            :class="paseador.rol === 'walker' ? 'wp-tag-walker' : 'wp-tag'"
          >
            +{{ paseador.insignias.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Botones de acción -->
      <div
        :class="[
          'flex gap-2 border-t pt-5',
          paseador.rol === 'walker' ? 'border-white/25' : 'border-[--color-line]',
        ]"
      >
        <button
          @click="emit('ver-perfil', paseador)"
          :class="paseador.rol === 'walker' ? 'wp-btn-ghost-walker flex-1' : 'wp-btn-ghost flex-1'"
        >
          Ver Perfil
        </button>
        <button
          @click="emit('contactar', paseador)"
          :class="paseador.rol === 'walker' ? 'wp-btn-primary-walker flex-1' : 'wp-btn-primary flex-1'"
        >
          <span>Contactar</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.wp-card { background: #FFFFFF; border: 1px solid var(--color-line); border-radius: 1.25rem; }
.wp-card-walker { background: #d67f28; border: 1px solid #C86400; border-radius: 1.25rem; color: #FFFFFF; }
.wp-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
.wp-tag { border: 1px solid var(--color-line); border-radius: 0.6rem; color: rgba(30, 43, 34, 0.7); font-size: 0.75rem; padding: 0.3rem 0.65rem; }
.wp-tag-walker { background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 0.6rem; color: #FFFFFF; font-size: 0.75rem; font-weight: 500; padding: 0.3rem 0.65rem; }
.wp-btn-primary, .wp-btn-ghost, .wp-btn-primary-walker, .wp-btn-ghost-walker { align-items: center; border-radius: 0.75rem; display: inline-flex; font-size: 0.85rem; font-weight: 600; justify-content: center; padding: 0.7rem 1rem; transition: all 0.15s ease; }
.wp-btn-primary { background: var(--color-forest); color: var(--color-paper); }
.wp-btn-primary:hover { background: #33473A; }
.wp-btn-ghost { border: 1px solid var(--color-line); color: var(--color-ink); }
.wp-btn-ghost:hover { background: #F7F9F7; border-color: rgba(30,43,34,0.3); }
.wp-btn-primary-walker { background: #FFFFFF; color: #E17100; }
.wp-btn-primary-walker:hover { background: #FFF5EB; }
.wp-btn-ghost-walker { background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.55); color: #FFFFFF; }
.wp-btn-ghost-walker:hover { background: rgba(255, 255, 255, 0.24); border-color: #FFFFFF; }
</style>
