<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import logo from '../../assets/logo-allpets.png'
import { toApiUrl } from '../../config'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { formatARS } from '../../utils/currency'
import { scrollToSection } from '../../utils/scroll'
import ThemeToggle from './ThemeToggle.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()

const role = computed(() => authStore.user?.role as string | undefined)
const isWorker = computed(() => role.value === 'walker' || role.value === 'caregiver')
const isAdmin = computed(() => role.value === 'admin')
/** Prestadores y admin solo usan su panel: el header oculta la tienda y el buscador. */
const isStaff = computed(() => isWorker.value || isAdmin.value)
const panelRoute = computed(() => ({ name: isAdmin.value ? 'admin' : 'worker-dashboard' }))
const panelLabel = computed(() => {
  if (isAdmin.value) return 'Panel de administración'
  return role.value === 'caregiver' ? 'Panel de cuidador' : 'Panel de paseador'
})
const firstName = computed(() => String(authStore.user?.name ?? '').split(' ')[0] || 'Mi cuenta')
const avatar = computed(() => (authStore.user?.profile_image ? toApiUrl(authStore.user.profile_image) : ''))

// ---------- Menús y Eventos ----------
const accountOpen = ref(false)
const drawerOpen = ref(false)
const accountRef = ref<HTMLElement | null>(null)

const closeAll = () => {
  accountOpen.value = false
  drawerOpen.value = false
}

watch(() => route.fullPath, closeAll)
watch(drawerOpen, (open) => (document.body.style.overflow = open ? 'hidden' : ''))

const onDocClick = (e: MouseEvent) => {
  if (accountOpen.value && accountRef.value && !accountRef.value.contains(e.target as Node)) {
    accountOpen.value = false
  }
}
const onKeydown = (e: KeyboardEvent) => e.key === 'Escape' && closeAll()

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})

// ---------- Buscador ----------
type SearchScope = 'shop' | 'paseadores'
const searchScopes: { value: SearchScope; label: string; placeholder: string }[] = [
  { value: 'shop', label: 'Tienda', placeholder: 'Buscá alimentos, juguetes, accesorios...' },
  { value: 'paseadores', label: 'Servicios', placeholder: 'Buscá paseadores o cuidadores por nombre o zona...' },
]
const searchScope = ref<SearchScope>(route.name === 'paseadores' ? 'paseadores' : 'shop')
const searchTerm = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchPlaceholder = computed(
  () => searchScopes.find((s) => s.value === searchScope.value)?.placeholder ?? '',
)

function submitSearch() {
  const q = searchTerm.value.trim()
  router.push({ name: searchScope.value, query: q ? { q } : {} })
}

// ---------- Tema y Sesión ----------
const isDark = ref(document.documentElement.classList.contains('dark'))
function setTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
}

function logout() {
  authStore.logout()
  cartStore.reset()
  closeAll()
  router.push({ name: 'login' })
}

// ---------- Enlaces ----------
// "Servicios" (paseadores y cuidadores) y "Quiénes somos" son secciones de /paseadores.
interface MainLink {
  key: string
  label: string
  icon: string
  to: { name: string; hash?: string }
  active: boolean
}

const mainLinks = computed<MainLink[]>(() => {
  const { name, hash } = route
  const onDirectory = name === 'paseadores'
  return [
    { key: 'inicio', label: 'Inicio', icon: '🏠', to: { name: 'home' }, active: name === 'home' },
    { key: 'tienda', label: 'Tienda', icon: '🛍️', to: { name: 'shop' }, active: name === 'shop' },
    {
      key: 'servicios',
      label: 'Servicios',
      icon: '🦮',
      to: { name: 'paseadores', hash: '#servicios' },
      active: onDirectory && hash !== '#quienes-somos',
    },
    {
      key: 'quienes-somos',
      label: 'Quiénes somos',
      icon: '🐾',
      to: { name: 'paseadores', hash: '#quienes-somos' },
      active: onDirectory && hash === '#quienes-somos',
    },
  ]
})

// Animación al seleccionar una opción; después el router lleva a la sección.
const pressedKey = ref<string | null>(null)
let pressTimer: ReturnType<typeof setTimeout> | undefined

function handleNavClick(link: MainLink) {
  clearTimeout(pressTimer)
  pressedKey.value = null
  // Un frame sin la clase permite repetir la animación en clics seguidos.
  requestAnimationFrame(() => {
    pressedKey.value = link.key
    pressTimer = setTimeout(() => (pressedKey.value = null), 550)
  })
  // Si ya estás en esa misma sección el router no navega: se desplaza igual.
  if (link.to.hash && route.name === link.to.name && route.hash === link.to.hash) {
    scrollToSection(link.to.hash)
  }
}

const accountLinks = computed(() => {
  if (isAdmin.value) return [{ label: 'Administración', to: { name: 'admin' } }]
  if (isWorker.value) return [{ label: 'Mi panel', to: { name: 'worker-dashboard' } }]
  return [
    { label: 'Mi perfil', to: { name: 'client-profile' } },
    { label: 'Mi carrito', to: { name: 'cart' } },
  ]
})
</script>

<template>
  <!-- Header blanco (oscuro en modo oscuro): colores en main.css, variables --header-* -->
  <header
    class="sticky top-0 z-40 border-b border-(--header-border) bg-(--header-bg) text-(--header-text) shadow-[0_6px_18px_-12px_rgb(0_0_0/0.25)] transition-colors duration-300"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Fila principal: Logo, Buscador y Acciones -->
      <div class="flex h-[4.5rem] items-center justify-between gap-3 md:gap-6">
        <!-- Botón Menú Móvil -->
        <button
          type="button"
          class="rounded-xl p-2 transition hover:bg-(--header-hover) active:scale-90 md:hidden"
          aria-label="Abrir menú"
          @click="drawerOpen = true"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Logo: sello siempre blanco (el PNG tiene fondo blanco), se ve igual en claro y oscuro -->
        <RouterLink
          :to="isStaff ? panelRoute : { name: 'home' }"
          class="logo-badge h-12 w-14 shrink-0 active:scale-95 md:h-[3.25rem] md:w-[3.75rem]"
          :aria-label="isStaff ? `AllPets, ir a ${panelLabel}` : 'AllPets, ir al inicio'"
        >
          <img :src="logo" alt="AllPets" />
        </RouterLink>

        <!-- Prestadores y admin: solo el nombre de su panel -->
        <p v-if="isStaff" class="mr-auto hidden text-sm font-semibold text-(--header-muted) sm:block">
          {{ panelLabel }}
        </p>

        <!-- Buscador (Escritorio) -->
        <form
          v-else
          role="search"
          class="search-box hidden max-w-2xl flex-1 md:flex"
          @submit.prevent="submitSearch"
        >
          <!-- Dónde buscar: Tienda o Servicios -->
          <div class="search-scopes" role="radiogroup" aria-label="Buscar en">
            <button
              v-for="scope in searchScopes"
              :key="scope.value"
              type="button"
              role="radio"
              class="search-scope"
              :class="{ 'is-selected': searchScope === scope.value }"
              :aria-checked="searchScope === scope.value"
              @click="searchScope = scope.value"
            >
              {{ scope.label }}
            </button>
          </div>

          <svg
            class="ml-3 h-4 w-4 shrink-0 text-(--header-muted)"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" /><path stroke-linecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            v-model="searchTerm"
            type="search"
            aria-label="Qué estás buscando"
            :placeholder="searchPlaceholder"
            class="search-input"
          />
          <button type="submit" class="search-submit">
            Buscar
          </button>
        </form>

        <!-- Acciones Derecha -->
        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <!-- Ofrecé tus servicios (Escritorio, solo clientes y visitantes) -->
          <RouterLink
            v-if="!isStaff"
            :to="{ name: 'register-worker' }"
            class="hidden items-center rounded-full border border-(--header-border) px-3.5 py-1.5 text-xs font-semibold text-(--header-text) transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:bg-(--brand) hover:text-white hover:shadow-md active:scale-95 lg:inline-flex"
          >
            Ofrecé servicios
          </RouterLink>

          <!-- Interruptor claro / oscuro (sol con nubes ↔ luna con estrellas) -->
          <ThemeToggle :model-value="isDark" @update:model-value="setTheme" />

          <!-- Menú Cuenta -->
          <div v-if="authStore.isAuthenticated" ref="accountRef" class="relative">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full p-1 pr-2.5 transition duration-200 hover:bg-(--header-hover) active:scale-95"
              @click="accountOpen = !accountOpen"
            >
              <span
                class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-(--header-hover) text-(--header-accent) ring-2 ring-(--header-border)"
              >
                <img v-if="avatar" :src="avatar" alt="" class="h-full w-full object-cover" />
                <span v-else class="text-xs font-bold">{{ firstName[0] }}</span>
              </span>
              <span class="hidden text-xs font-semibold sm:block">{{ firstName }} ▾</span>
            </button>

            <!-- Dropdown Animado -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="scale-95 opacity-0 -translate-y-2"
              enter-to-class="scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="scale-100 opacity-100 translate-y-0"
              leave-to-class="scale-95 opacity-0 -translate-y-2"
            >
              <div
                v-if="accountOpen"
                class="absolute right-0 top-full z-50 mt-2 w-52 origin-top-right overflow-hidden rounded-2xl border border-(--header-border) bg-(--header-bg) py-1.5 text-sm text-(--header-text) shadow-xl"
              >
                <p class="truncate border-b border-(--header-border) px-4 py-2 text-xs text-(--header-muted)">
                  {{ authStore.user?.email }}
                </p>
                <RouterLink
                  v-for="link in accountLinks"
                  :key="link.label"
                  :to="link.to"
                  class="block px-4 py-2 font-medium transition-colors hover:bg-(--header-hover) hover:text-(--header-accent)"
                >
                  {{ link.label }}
                </RouterLink>
                <button
                  type="button"
                  class="block w-full px-4 py-2 text-left font-medium text-red-600 transition-colors hover:bg-red-50"
                  @click="logout"
                >
                  Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>

          <RouterLink
            v-else
            :to="{ name: 'login' }"
            class="rounded-full bg-(--brand) px-4 py-1.5 text-xs font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-(--brand-dark) hover:shadow-md active:scale-95"
          >
            Ingresá
          </RouterLink>

          <!-- Carrito (solo clientes y visitantes) -->
          <RouterLink
            v-if="!isStaff"
            :to="authStore.isAuthenticated ? { name: 'cart' } : { name: 'login' }"
            class="group relative flex items-center gap-2 rounded-full p-2 transition duration-200 hover:bg-(--header-hover) active:scale-95"
            :aria-label="`Carrito: ${cartStore.cart.totalItems} productos`"
          >
            <div class="relative">
              <svg class="h-6 w-6 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
                <circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" />
              </svg>
              <span
                v-if="cartStore.cart.totalItems > 0"
                class="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--brand) px-1 text-[10px] font-extrabold text-white shadow-xs transition-transform group-hover:scale-110"
              >
                {{ cartStore.cart.totalItems }}
              </span>
            </div>
            <span class="hidden text-xs font-bold lg:block">{{ formatARS(cartStore.cart.total) }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- Buscador Móvil -->
      <form v-if="!isStaff" role="search" class="pb-3 md:hidden" @submit.prevent="submitSearch">
        <div class="search-box">
          <svg
            class="ml-3.5 h-4 w-4 shrink-0 text-(--header-muted)"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" /><path stroke-linecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            v-model="searchTerm"
            type="search"
            aria-label="Qué estás buscando"
            placeholder="¿Qué necesita tu mascota?"
            class="search-input"
          />
          <button type="submit" class="search-submit">Buscar</button>
        </div>
      </form>

      <!-- Navegación inferior (prestadores y admin solo usan su panel) -->
      <nav
        v-if="!isStaff"
        class="hidden h-11 items-center border-t border-(--header-border) text-sm md:flex"
        aria-label="Principal"
      >
        <ul class="flex items-center gap-6">
          <li v-for="link in mainLinks" :key="link.key">
            <RouterLink
              :to="link.to"
              class="nav-link relative inline-block py-2.5 font-medium text-(--header-muted) transition-colors duration-200 hover:text-(--header-text) after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-(--header-accent) after:transition-transform after:duration-300 hover:after:scale-x-100"
              :class="{ 'text-(--header-text) font-semibold after:scale-x-100': link.active, 'is-pressed': pressedKey === link.key }"
              :aria-current="link.active ? 'page' : undefined"
              @click="handleNavClick(link)"
            >
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Drawer Móvil con Animación de Deslizamiento -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="drawerOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden" @click="drawerOpen = false" />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="drawerOpen"
          class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col bg-(--header-bg) text-(--header-text) shadow-2xl md:hidden"
        >
          <div class="flex items-center justify-between border-b border-(--header-border) p-4">
            <span class="logo-badge h-10 w-12"><img :src="logo" alt="AllPets" /></span>
            <button type="button" class="rounded-lg p-1.5 hover:bg-(--header-hover) active:scale-90" aria-label="Cerrar menú" @click="drawerOpen = false">
              ✕
            </button>
          </div>

          <!-- Prestadores y admin: solo su panel -->
          <nav v-if="isStaff" class="flex-1 space-y-1 p-3">
            <RouterLink
              :to="panelRoute"
              class="flex items-center gap-3 rounded-xl bg-(--brand) px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:translate-x-1 hover:bg-(--brand-dark)"
            >
              <span>{{ isAdmin ? '⚙️' : '🐾' }}</span> {{ panelLabel }}
            </RouterLink>
          </nav>

          <nav v-else class="flex-1 space-y-1 p-3">
            <RouterLink
              v-for="link in mainLinks"
              :key="link.key"
              :to="link.to"
              class="nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:bg-(--header-hover)"
              :class="[
                link.active ? 'bg-(--brand) text-white font-bold shadow-sm hover:bg-(--brand-dark)' : '',
                { 'is-pressed': pressedKey === link.key },
              ]"
              :aria-current="link.active ? 'page' : undefined"
              @click="handleNavClick(link)"
            >
              <span>{{ link.icon }}</span> {{ link.label }}
            </RouterLink>
            <RouterLink
              :to="{ name: 'register-worker' }"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:bg-(--header-hover)"
            >
              <span>🐾</span> Ofrecé tus servicios
            </RouterLink>
          </nav>

          <div class="space-y-2 border-t border-(--header-border) p-4 text-sm">
            <template v-if="authStore.isAuthenticated">
              <RouterLink
                v-for="link in accountLinks"
                :key="link.label"
                :to="link.to"
                class="block py-1 font-medium text-(--header-muted) hover:text-(--header-text)"
              >
                {{ link.label }}
              </RouterLink>
              <button type="button" class="block w-full pt-2 text-left font-semibold text-red-600" @click="logout">
                Cerrar sesión
              </button>
            </template>
            <RouterLink v-else :to="{ name: 'login' }" class="block rounded-xl bg-(--brand) py-2 text-center font-bold text-white">
              Ingresá / Registrate
            </RouterLink>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
/* ---------- Buscador: mismo estilo que los campos de la página ---------- */
.search-box {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 0.9rem;
  border: 1px solid var(--search-border);
  background: var(--search-bg);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}
.search-box:hover {
  border-color: var(--header-accent);
}
.search-box:focus-within {
  border-color: var(--header-accent);
  background: var(--header-bg);
  box-shadow: 0 0 0 4px rgb(var(--brand-rgb) / 0.18);
}

/* Selector "Tienda / Servicios": dos botones tipo pastilla dentro del buscador */
.search-scopes {
  display: flex;
  gap: 0.2rem;
  margin: 0.3rem;
  padding: 0.2rem;
  border-radius: 0.7rem;
  background: var(--header-hover);
}
.search-scope {
  border-radius: 0.55rem;
  padding: 0.35rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--header-muted);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}
.search-scope:hover {
  color: var(--header-text);
}
.search-scope:focus-visible {
  outline: 2px solid var(--header-accent);
  outline-offset: 1px;
}
.search-scope.is-selected {
  background: var(--brand);
  color: #fff;
  box-shadow: 0 4px 10px -4px rgb(0 0 0 / 0.45);
}

.search-input {
  min-width: 0;
  flex: 1;
  background: transparent;
  padding: 0.65rem 0.75rem;
  font-size: 0.875rem;
  color: var(--header-text);
  outline: none;
}
.search-input::placeholder {
  color: var(--header-muted);
}

.search-submit {
  margin: 0.25rem;
  border-radius: 0.65rem;
  background: var(--brand);
  padding: 0.45rem 1.1rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}
.search-submit:hover {
  background: var(--brand-dark);
  box-shadow: 0 6px 14px -6px rgb(0 0 0 / 0.4);
}
.search-submit:active {
  transform: scale(0.95);
}

/* ---------- Animación al seleccionar una opción del menú ---------- */
@keyframes nav-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(0.88);
  }
  70% {
    transform: scale(1.1);
    text-shadow: 0 0 12px rgb(var(--brand-rgb) / 0.55);
  }
  100% {
    transform: scale(1);
  }
}

.nav-link.is-pressed {
  animation: nav-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .nav-link.is-pressed {
    animation: none;
  }
  .search-submit {
    transition: none;
  }
}
</style>
