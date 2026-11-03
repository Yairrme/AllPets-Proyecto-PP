<script setup lang="ts">
import { computed, ref } from 'vue'
import { toApiUrl } from '../../config'
import { labelFor } from '../../data/catalog'
import type { Product } from '../../types/shop'
import { formatARS } from '../../utils/currency'

const props = defineProps<{
  product: Product
  /** Unidades de este producto que ya están en el carrito. */
  inCart: number
  adding: boolean
}>()

const emit = defineEmits<{ (e: 'add', product: Product): void }>()

const imageFailed = ref(false)
const soldOut = computed(() => props.product.stock === 0)
const maxed = computed(() => props.inCart >= props.product.stock)
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div class="relative overflow-hidden bg-stone-100">
      <img
        v-if="!imageFailed"
        :src="toApiUrl(product.imageUrl)"
        :alt="product.title"
        loading="lazy"
        class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="imageFailed = true"
      />
      <!-- Si la URL no es una imagen válida, se muestra un ícono en vez del ícono roto -->
      <div
        v-else
        class="flex h-48 w-full items-center justify-center bg-(--brand-cream) text-6xl"
        role="img"
        :aria-label="product.title"
      >
        🐾
      </div>
      <span
        class="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-stone-700 shadow-xs"
      >
        {{ labelFor(product.petType) }} · {{ labelFor(product.category) }}
      </span>
      <span
        v-if="soldOut"
        class="absolute right-3 top-3 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white"
      >
        Sin stock
      </span>
      <span
        v-else-if="product.stock <= 5"
        class="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-stone-900"
      >
        ¡Últimas {{ product.stock }}!
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <h3 class="line-clamp-2 font-bold text-stone-900">{{ product.title }}</h3>
      <p class="mt-1 line-clamp-2 flex-1 text-sm text-stone-500">{{ product.description }}</p>
      <p class="mt-3 text-2xl font-extrabold text-stone-900">{{ formatARS(product.price) }}</p>
      <button
        type="button"
        class="mt-3 w-full rounded-xl bg-(--brand) py-2.5 font-bold text-white transition hover:bg-(--brand-dark) active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300"
        :disabled="soldOut || adding || maxed"
        @click="emit('add', product)"
      >
        <template v-if="soldOut">Sin stock</template>
        <template v-else-if="maxed">Máximo en tu carrito</template>
        <template v-else-if="adding">Agregando...</template>
        <template v-else>🛒 Agregar al carrito</template>
      </button>
    </div>
  </article>
</template>
