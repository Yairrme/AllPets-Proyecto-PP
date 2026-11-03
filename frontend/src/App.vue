<script setup lang="ts">
import { onMounted, watch } from "vue";
import { RouterView } from "vue-router";
import AppFooter from "./components/layout/AppFooter.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import { useAuthStore } from "./stores/auth";
import { useCartStore } from "./stores/cart";

const authStore = useAuthStore();
const cartStore = useCartStore();

/** El carrito es solo para clientes (los prestadores y el admin no compran). */
function loadCartIfClient() {
  const role = authStore.user?.role;
  if (authStore.isAuthenticated && role !== "walker" && role !== "caregiver" && role !== "admin") {
    cartStore.fetchCart();
  }
}

onMounted(() => {
  authStore.loadUserFromStorage();
  loadCartIfClient();
});

// Al iniciar sesión se carga el carrito para mostrar el total en el header.
watch(
  () => authStore.token,
  (token) => (token ? loadCartIfClient() : cartStore.reset()),
);
</script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50/70 font-sans text-stone-800">
    <AppHeader />

    <!-- La clave es la ruta sin query: cambiar filtros (?categoria=...) no recrea la vista -->
    <main class="flex-1 overflow-x-hidden text-stone-900">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}

/* Animación de transición entre vistas */
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.99);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.99);
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: none;
  }
}
</style>
