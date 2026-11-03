<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import tiendaImg from '../assets/tienda-gato.webp'
import ProductCard from '../components/shop/ProductCard.vue'
import { labelFor } from '../data/catalog'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useProductsStore, type ProductSort } from '../stores/products'
import type { Product } from '../types/shop'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const addingId = ref<string | null>(null)
const feedback = ref<{ type: 'ok' | 'error'; text: string } | null>(null)
const sort = ref<ProductSort>('relevancia')

onMounted(() => {
  loadProducts()
  if (authStore.isAuthenticated) cartStore.fetchCart()
})

// Los filtros viven en la URL: el buscador y el menú del header solo navegan.
const queryText = (key: string) =>
  typeof route.query[key] === 'string' ? (route.query[key] as string) : ''
const search = computed(() => queryText('q').trim())
const mascota = computed(() => queryText('mascota'))
const categoria = computed(() => queryText('categoria'))

function setFilter(patch: Record<string, string | undefined>) {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (typeof value === 'string' && value) query[key] = value
  }
  router.replace({ name: 'shop', query })
}

// La API aplica los filtros y devuelve cuántos productos hay en cada opción.
function loadProducts() {
  productsStore.fetchProducts({
    q: search.value || undefined,
    petType: mascota.value || undefined,
    category: categoria.value || undefined,
    sort: sort.value,
  })
}
watch([search, mascota, categoria, sort], loadProducts)

const countsOf = (facets: { value: string; count: number }[]) =>
  Object.fromEntries(facets.map((facet) => [facet.value, facet.count]))

const petTypes = computed(() => productsStore.facets.petTypes.map((f) => f.value))
const petTypeCounts = computed(() => countsOf(productsStore.facets.petTypes))
const categories = computed(() => productsStore.facets.categories.map((f) => f.value))
const categoryCounts = computed(() => countsOf(productsStore.facets.categories))
const filtered = computed(() => productsStore.products)

const title = computed(() => {
  if (search.value) return `Resultados para “${search.value}”`
  const parts = [categoria.value, mascota.value].filter(Boolean).map(labelFor)
  return parts.length ? parts.join(' para ') : 'Tienda'
})
const hasFilters = computed(() => Boolean(search.value || mascota.value || categoria.value))

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

const chipClass = (active: boolean) =>
  active
    ? 'bg-(--brand) text-white border-(--brand)'
    : 'bg-white text-stone-700 border-stone-300 hover:border-(--brand)'
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Migas de pan -->
    <nav class="mb-4 text-sm text-stone-500" aria-label="Ruta">
      <RouterLink :to="{ name: 'home' }" class="hover:underline">Inicio</RouterLink>
      <span class="mx-1.5">›</span>
      <RouterLink :to="{ name: 'shop' }" class="hover:underline">Tienda</RouterLink>
      <template v-if="mascota">
        <span class="mx-1.5">›</span>
        <span>{{ labelFor(mascota) }}</span>
      </template>
      <template v-if="categoria">
        <span class="mx-1.5">›</span>
        <span>{{ labelFor(categoria) }}</span>
      </template>
    </nav>

    <!-- Presentación de la tienda -->
    <!-- Banner compacto: deja ver los productos enseguida -->
    <section
      class="shop-intro relative mb-8 flex items-center gap-5 overflow-hidden rounded-2xl border border-stone-200 bg-(--brand-cream) px-5 py-5 sm:gap-8 sm:px-8 sm:py-6"
      aria-labelledby="shop-intro-title"
    >
      <!-- Huellitas decorativas de fondo -->
      <svg
        class="pointer-events-none absolute -right-4 -top-6 h-32 w-32 rotate-12 text-(--brand) opacity-[0.07]"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="6" cy="9" r="2.2" /><circle cx="10" cy="5.5" r="2.2" /><circle cx="14" cy="5.5" r="2.2" /><circle cx="18" cy="9" r="2.2" />
        <path d="M12 10.5c-3 0-6 3.6-6 6.2 0 1.8 1.4 2.8 3 2.8 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-1 3-2.8 0-2.6-3-6.2-6-6.2Z" />
      </svg>

      <div class="relative min-w-0 flex-1">
        <p class="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-(--brand)">Tienda AllPets</p>
        <h2
          id="shop-intro-title"
          class="shop-serif mt-1 text-xl font-semibold leading-tight text-stone-900 sm:text-2xl lg:text-[1.75rem]"
        >
          Todo para tu mascota, en un solo lugar
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-[0.95rem]">
          Alimentos, juguetes y accesorios para perros y gatos, elegidos para su bienestar.
          Armá tu carrito y te lo llevamos a domicilio en Cipolletti y Neuquén.
        </p>
      </div>

      <img
        :src="tiendaImg"
        alt="Gato apoyado sobre una notebook con la tienda AllPets abierta"
        class="relative h-24 w-24 shrink-0 rotate-2 rounded-2xl border-4 border-white object-cover shadow-lg transition-transform duration-300 hover:rotate-0 hover:scale-105 sm:h-32 sm:w-32 lg:h-36 lg:w-36"
      />
    </section>

    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-stone-900">{{ title }}</h1>
        <p v-if="!productsStore.isLoading" class="mt-1 text-stone-500">
          {{ productsStore.total }} {{ productsStore.total === 1 ? 'producto' : 'productos' }}
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm font-semibold text-stone-700">
        Ordenar por
        <select
          v-model="sort"
          class="rounded-xl border border-stone-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/40"
        >
          <option value="relevancia">Relevancia</option>
          <option value="precio-asc">Menor precio</option>
          <option value="precio-desc">Mayor precio</option>
        </select>
      </label>
    </div>

    <p
      v-if="feedback"
      role="status"
      class="mb-6 rounded-xl border px-4 py-3 text-sm font-medium"
      :class="
        feedback.type === 'ok'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      "
    >
      {{ feedback.text }}
      <RouterLink
        v-if="feedback.type === 'ok'"
        :to="{ name: 'cart' }"
        class="ml-2 font-bold underline"
      >
        Ver carrito
      </RouterLink>
    </p>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
      <!-- Filtros -->
      <aside class="space-y-6" aria-label="Filtros">
        <div>
          <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Mascota</h2>
          <div class="flex flex-wrap gap-2 lg:flex-col">
            <button
              type="button"
              class="rounded-full border px-3.5 py-1.5 text-left text-sm font-semibold transition lg:rounded-xl"
              :class="chipClass(!mascota)"
              @click="setFilter({ mascota: undefined, categoria: undefined })"
            >
              Todas
            </button>
            <button
              v-for="pet in petTypes"
              :key="pet"
              type="button"
              class="flex items-center justify-between gap-2 rounded-full border px-3.5 py-1.5 text-left text-sm font-semibold transition lg:rounded-xl"
              :class="chipClass(mascota === pet)"
              @click="setFilter({ mascota: pet, categoria: undefined })"
            >
              {{ labelFor(pet) }}
              <span class="text-xs opacity-70">{{ petTypeCounts[pet] }}</span>
            </button>
          </div>
        </div>

        <div v-if="categories.length">
          <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Categoría</h2>
          <div class="flex flex-wrap gap-2 lg:flex-col">
            <button
              type="button"
              class="rounded-full border px-3.5 py-1.5 text-left text-sm font-semibold transition lg:rounded-xl"
              :class="chipClass(!categoria)"
              @click="setFilter({ categoria: undefined })"
            >
              Todas
            </button>
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="flex items-center justify-between gap-2 rounded-full border px-3.5 py-1.5 text-left text-sm font-semibold transition lg:rounded-xl"
              :class="chipClass(categoria === cat)"
              @click="setFilter({ categoria: cat })"
            >
              {{ labelFor(cat) }}
              <span class="text-xs opacity-70">{{ categoryCounts[cat] }}</span>
            </button>
          </div>
        </div>

        <button
          v-if="hasFilters"
          type="button"
          class="text-sm font-bold text-(--brand) hover:underline"
          @click="router.replace({ name: 'shop' })"
        >
          ✕ Limpiar filtros
        </button>
      </aside>

      <!-- Resultados -->
      <div>
        <p v-if="productsStore.isLoading" class="text-stone-500">Cargando catálogo...</p>

        <div
          v-else-if="productsStore.error"
          class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
        >
          <p>{{ productsStore.error }}</p>
          <button class="mt-3 text-sm font-bold underline" @click="loadProducts">
            Reintentar
          </button>
        </div>

        <div
          v-else-if="filtered.length === 0"
          class="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500"
        >
          <p class="text-4xl" aria-hidden="true">🔍</p>
          <p class="mt-2">
            {{
              hasFilters
                ? 'No encontramos productos con esos filtros.'
                : 'Todavía no hay productos cargados.'
            }}
          </p>
          <button
            v-if="hasFilters"
            type="button"
            class="mt-4 rounded-xl bg-(--brand) px-5 py-2 font-bold text-white"
            @click="router.replace({ name: 'shop' })"
          >
            Ver todos los productos
          </button>
        </div>

        <template v-else>
          <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <li v-for="product in filtered" :key="product._id">
              <ProductCard
                :product="product"
                :in-cart="inCart(product._id)"
                :adding="addingId === product._id"
                @add="addToCart"
              />
            </li>
          </ul>
          <div v-if="productsStore.hayMas" class="mt-8 text-center">
            <button
              type="button"
              class="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-(--brand) disabled:opacity-50"
              :disabled="productsStore.isLoadingMore"
              @click="productsStore.fetchMore()"
            >
              {{ productsStore.isLoadingMore ? 'Cargando...' : 'Ver más productos' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Misma tipografía de títulos que la sección de paseadores */
.shop-serif {
  font-family: 'Fraunces', ui-serif, Georgia, serif;
}
</style>
