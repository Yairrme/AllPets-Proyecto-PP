<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import logo from './assets/logo.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isWorker = computed(() => {
  return authStore.user?.role === 'walker' || authStore.user?.role === 'caregiver'
})

const isExplorarActive = computed(() => {
  return route.path === '/paseadores' && route.hash !== '#beneficios'
})

const isBeneficiosActive = computed(() => {
  return route.path === '/paseadores' && route.hash === '#beneficios'
})

const userRoleBadge = computed(() => {
  if (authStore.user?.role === 'walker') return 'Paseador'
  if (authStore.user?.role === 'caregiver') return 'Cuidador'
  return 'Cliente'
})

onMounted(() => {
  authStore.loadUserFromStorage()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-stone-50/70 font-sans text-stone-800">
    <!-- Navbar Superior Minimalista y Elegante -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-28 flex items-center justify-between">
        
        <!-- Logo AllPets -->
        <div class="flex items-center gap-4">
          <router-link :to="isWorker ? '/mi-panel' : '/paseadores'" class="flex items-center gap-4 group">
            <div class="w-20 h-20 rounded-2xl bg-stone-100 p-1.5 flex items-center justify-center border border-stone-200/70 group-hover:border-amber-500/50 transition-all shadow-xs shrink-0">
              <img :src="logo" alt="AllPets Logo" class="w-full h-full object-contain drop-shadow-xs" />
            </div>
            <div>
              <span class="text-2xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2.5">
                AllPets
                <span v-if="isWorker" class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
                  Panel {{ userRoleBadge }}
                </span>
                <span v-else class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  Paseadores
                </span>
              </span>
              <span v-if="isWorker" class="block text-xs text-stone-500 font-medium mt-0.5">Gestión de tu perfil y servicios</span>
              <span v-else class="block text-xs text-stone-500 font-medium mt-0.5">Cuidado y paseos de confianza</span>
            </div>
          </router-link>
        </div>

        <!-- Enlaces de Navegación Minimalistas (Ocultos para trabajadores) -->
        <nav v-if="!isWorker" class="hidden md:flex items-center gap-8 font-semibold text-sm">
          <router-link
            :to="{ path: '/paseadores', hash: '' }"
            class="relative py-1.5 transition-all duration-300"
            :class="isExplorarActive ? 'text-amber-700 font-bold' : 'text-stone-600 hover:text-amber-700'"
          >
            Explorar Paseadores
            <span
              class="absolute bottom-0 left-0 h-0.5 bg-amber-600 rounded-full transition-all duration-300"
              :class="isExplorarActive ? 'w-full opacity-100' : 'w-0 opacity-0'"
            />
          </router-link>
          <router-link
            :to="{ path: '/paseadores', hash: '#beneficios' }"
            class="relative py-1.5 transition-all duration-300"
            :class="isBeneficiosActive ? 'text-amber-700 font-bold' : 'text-stone-600 hover:text-amber-700'"
          >
            Cómo funciona
            <span
              class="absolute bottom-0 left-0 h-0.5 bg-amber-600 rounded-full transition-all duration-300"
              :class="isBeneficiosActive ? 'w-full opacity-100' : 'w-0 opacity-0'"
            />
          </router-link>
        </nav>

        <!-- Perfil / CTA derecho -->
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-4 pl-4 border-l border-stone-200">
            <template v-if="authStore.isAuthenticated">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-sm font-bold text-stone-700 shadow-2xs overflow-hidden">
                  <img
                    v-if="authStore.user?.profile_image"
                    :src="authStore.user.profile_image.startsWith('http') ? authStore.user.profile_image : `http://localhost:3000${authStore.user.profile_image}`"
                    alt="Avatar"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>👤</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-stone-800">{{ authStore.user?.name || 'Mi Cuenta' }}</span>
                  <div class="flex gap-2 text-[10px]">
                    <RouterLink v-if="authStore.user?.role === 'walker' || authStore.user?.role === 'caregiver'" to="/mi-panel" class="text-indigo-600 hover:text-indigo-800 font-medium">Mi Panel</RouterLink>
                    <RouterLink v-else-if="authStore.user?.role === 'client'" to="/mi-perfil" class="text-amber-600 hover:text-amber-800 font-medium">Mi Perfil</RouterLink>
                    <button @click="handleLogout" class="text-red-500 hover:text-red-700 text-left">Cerrar sesión</button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <RouterLink
                to="/login"
                class="text-sm font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                :class="route.path === '/login' ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:text-amber-600 hover:bg-stone-100'"
              >
                Iniciar Sesión
              </RouterLink>
              <RouterLink
                to="/register"
                class="text-xs font-bold bg-amber-500 text-white px-3.5 py-2 rounded-lg hover:bg-amber-600 hover:shadow-md active:scale-95 transition-all duration-200"
              >
                Registrarse
              </RouterLink>
            </template>
          </div>
        </div>

      </div>
    </header>

    <!-- Contenido Principal (Router View con Transición Animada) -->
    <main class="flex-1 text-stone-900 overflow-x-hidden">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="currentRoute.fullPath" />
        </Transition>
      </RouterView>
    </main>

    <!-- Pie de Página Minimalista -->
    <footer class="bg-white border-t border-stone-200 py-12 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500">
        <div class="flex items-center gap-3">
          <img :src="logo" alt="AllPets Mini" class="w-7 h-7 object-contain opacity-80 grayscale hover:grayscale-0 transition-all" />
          <span class="font-bold text-stone-700">AllPets</span>
          <span>• Módulo Frontend de Paseadores</span>
        </div>
        <div class="text-center sm:text-right">
          © 2026 Práctica Profesionalizante III. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Estilos globales y scrollbar suave */
html {
  scroll-behavior: smooth;
}

/* Animación de transición entre vistas y secciones */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.99);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.99);
}
</style>
