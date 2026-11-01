<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import AdminCaregiversView from "./AdminCaregiversView.vue";
import AdminProductsView from "./AdminProductsView.vue";

type Section = "paseadores" | "productos";

const tabs: { key: Section; label: string }[] = [
  { key: "paseadores", label: "Paseadores y cuidadores" },
  { key: "productos", label: "Productos" },
];

const route = useRoute();
// /admin?seccion=productos abre directamente la pestaña de productos.
const section = ref<Section>(
  route.query.seccion === "productos" ? "productos" : "paseadores",
);
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-extrabold tracking-tight text-stone-900">
      Administración
    </h1>

    <div
      class="mt-6 mb-8 flex gap-6 border-b border-stone-200"
      role="tablist"
      aria-label="Secciones de administración"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="section === tab.key"
        class="pb-3 -mb-px text-sm font-bold border-b-2 transition"
        :class="
          section === tab.key
            ? 'border-amber-500 text-amber-700'
            : 'border-transparent text-stone-600 hover:text-amber-700'
        "
        @click="section = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <AdminCaregiversView v-if="section === 'paseadores'" />
    <AdminProductsView v-else />
  </section>
</template>
