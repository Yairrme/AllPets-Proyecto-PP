<script setup lang="ts">
import logo from '../../assets/logo-allpets.png'

const year = new Date().getFullYear()
</script>

<template>
  <!-- Blanco en modo claro y negro en modo oscuro (main.css adapta bg-white y los grises) -->
  <footer class="mt-auto border-t border-stone-200 bg-white">
    <div
      class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6 lg:px-8"
    >
      <div class="flex items-center gap-3">
        <span class="logo-badge h-10 w-12"><img :src="logo" alt="AllPets" /></span>
        <span>Todo lo que tu mascota necesita, a un clic de distancia.</span>
      </div>
      <p class="text-xs">© {{ year }} AllPets · Práctica Profesionalizante III · ITS Cipolletti</p>
    </div>
  </footer>
</template>
