<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import type { Product } from '../types/shop'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const search = ref('')
const addingId = ref<string | null>(null)
const feedback = ref<{ type: 'ok' | 'error'; text: string } | null>(null)

onMounted(() => {
  productsStore.fetchProducts()
  if (authStore.isAuthenticated) cartStore.fetchCart()
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return productsStore.products
  return productsStore.products.filter((p) =>
    [p.title, p.description, p.category, p.petType].some((field) => field.toLowerCase().includes(term)),
  )
})

const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

function inCart(productId: string): number {
  return cartStore.cart.items.find((i) => i.productId === productId)?.quantity ?? 0
}

async function addToCart(product: Product) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  addingId.value = product._id
  const ok = await cartStore.addItem(product._id, 1)
  addingId.value = null
  feedback.value = ok
    ? { type: 'ok', text: `"${product.title}" agregado al carrito.` }
    : { type: 'error', text: cartStore.error }
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-stone-900">Tienda</h1>
        <p class="text-stone-500 mt-1">Todo lo que tu mascota necesita.</p>
      </div>
      <input
        v-model="search"
        type="search"
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        class="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
      />
    </div>

    <p
      v-if="feedback"
      role="status"
      class="mb-6 px-4 py-3 rounded-xl text-sm font-medium border"
      :class="
        feedback.type === 'ok'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      "
    >
      {{ feedback.text }}
    </p>

    <p v-if="productsStore.isLoading" class="text-stone-500">Cargando catálogo...</p>

    <div v-else-if="productsStore.error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
      <p>{{ productsStore.error }}</p>
      <button
        class="mt-3 text-sm font-bold underline"
        @click="productsStore.fetchProducts()"
      >
        Reintentar
      </button>
    </div>

    <p v-else-if="filtered.length === 0" class="text-stone-500">
      {{ search ? 'No encontramos productos con esa búsqueda.' : 'Todavía no hay productos cargados.' }}
    </p>

    <ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <li
        v-for="product in filtered"
        :key="product._id"
        class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col"
      >
        <img :src="product.imageUrl" :alt="product.title" class="h-44 w-full object-cover bg-stone-100" />
        <div class="p-4 flex flex-col flex-1">
          <h2 class="font-bold text-stone-900">{{ product.title }}</h2>
          <p class="text-sm text-stone-500 mt-1 flex-1">{{ product.description }}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-lg font-extrabold text-amber-700">{{ formatPrice(product.price) }}</span>
            <span v-if="product.stock === 0" class="text-xs font-bold text-red-600">Sin stock</span>
            <span v-else-if="product.stock <= 5" class="text-xs font-bold text-amber-700">
              Quedan {{ product.stock }}
            </span>
          </div>
          <button
            class="mt-3 w-full rounded-xl bg-amber-500 text-white font-bold py-2.5 hover:bg-amber-600 active:scale-95 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
            :disabled="product.stock === 0 || addingId === product._id || inCart(product._id) >= product.stock"
            @click="addToCart(product)"
          >
            <template v-if="product.stock === 0">Sin stock</template>
            <template v-else-if="inCart(product._id) >= product.stock">Máximo en tu carrito</template>
            <template v-else-if="addingId === product._id">Agregando...</template>
            <template v-else>Agregar al carrito</template>
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
