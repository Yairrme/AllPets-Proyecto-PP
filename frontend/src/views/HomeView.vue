<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import PaseadorCard from '../components/paseadores/PaseadorCard.vue'
import PaseadoresHero from '../components/paseadores/PaseadoresHero.vue'
import heroClaroImg from '../assets/hero-allpets-claro.webp'
import heroOscuroImg from '../assets/hero-allpets-oscuro.webp'
import { usePaseadoresStore } from '../stores/paseadores'
import type { Paseador } from '../types/paseador'
import { useContactarPaseador } from '../composables/useContactarPaseador'

const router = useRouter()
const paseadoresStore = usePaseadoresStore()

onMounted(() => {
  paseadoresStore.fetchDestacados()
})

const { contactar, contactError } = useContactarPaseador()

function verPerfil(paseador: Paseador) {
  router.push({ name: 'paseadores', query: { perfil: paseador.id } })
}
</script>

<template>
  <div class="home-root min-h-screen bg-white pb-20 text-(--color-ink)">
    <div class="mx-auto max-w-[1400px] px-5 pt-10 sm:px-8 lg:px-10">
      <!-- Foto y presentación (la misma de la sección de paseadores) -->
      <!-- Ilustración del perro y el gato: versión clara y versión oscura según el tema -->
      <PaseadoresHero
        :image="heroClaroImg"
        :image-dark="heroOscuroImg"
        image-alt="Ilustración de un perro y un gato juntos, el símbolo de AllPets"
      />

      <!-- Paseadores y cuidadores -->
      <section aria-labelledby="walkers-title">
        <p v-if="contactError" role="alert" class="mb-4 text-sm text-red-600">{{ contactError }}</p>
        <div class="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 id="walkers-title" class="home-serif text-2xl font-semibold sm:text-3xl">
              Paseadores y cuidadores
            </h2>
            <p
              v-if="!paseadoresStore.isLoading && !paseadoresStore.error"
              class="mt-1 text-sm text-(--color-ink)/55"
            >
              {{ paseadoresStore.disponiblesCount }}
              {{ paseadoresStore.disponiblesCount === 1 ? 'disponible' : 'disponibles' }} ahora en Cipolletti y
              Neuquén
            </p>
          </div>
          <RouterLink
            :to="{ name: 'paseadores' }"
            class="rounded-xl border border-(--color-line) px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-(--color-forest) hover:shadow-md"
          >
            Ver todos →
          </RouterLink>
        </div>

        <div
          v-if="paseadoresStore.isLoading"
          class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          <div v-for="n in 3" :key="n" class="h-[30rem] animate-pulse rounded-2xl bg-stone-200/70" />
        </div>

        <div
          v-else-if="paseadoresStore.error"
          role="alert"
          class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
        >
          <p>{{ paseadoresStore.error }}</p>
          <button
            class="mt-3 text-sm font-bold underline"
            @click="paseadoresStore.fetchDestacados()"
          >
            Reintentar
          </button>
        </div>

        <div
          v-else-if="paseadoresStore.destacados.length === 0"
          class="rounded-2xl border border-dashed border-(--color-line) p-10 text-center text-(--color-ink)/60"
        >
          Todavía no hay paseadores ni cuidadores aprobados.
          <RouterLink :to="{ name: 'register-worker' }" class="font-semibold underline">
            ¿Querés ser el primero?
          </RouterLink>
        </div>

        <div v-else class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <PaseadorCard
            v-for="paseador in paseadoresStore.destacados"
            :key="paseador.id"
            :paseador="paseador"
            @contactar="contactar"
            @ver-perfil="verPerfil"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Misma tipografía que la sección de paseadores */
.home-root {
  font-family: 'Public Sans', ui-sans-serif, system-ui, sans-serif;
}
.home-serif {
  font-family: 'Fraunces', ui-serif, Georgia, serif;
}
</style>
