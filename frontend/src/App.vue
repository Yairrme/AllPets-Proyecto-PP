<script setup lang="ts">
import { RouterView } from 'vue-router'
import logo from './assets/logo.png'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-stone-50/70 dark:bg-zinc-950 font-sans text-stone-800 dark:text-zinc-100">
    <!-- Navbar Superior Minimalista y Elegante -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-zinc-800/80 shadow-xs transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Logo AllPets -->
        <div class="flex items-center gap-3.5">
          <router-link to="/paseadores" class="flex items-center gap-3.5 group">
            <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-800/60 p-1 flex items-center justify-center border border-stone-200/70 dark:border-zinc-700/60 group-hover:border-amber-500/50 transition-all shadow-xs">
              <img :src="logo" alt="AllPets Logo" class="w-10 h-10 object-contain drop-shadow-xs" />
            </div>
            <div>
              <span class="text-xl font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
                AllPets
                <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Paseadores
                </span>
              </span>
              <span class="block text-[11px] text-stone-500 dark:text-zinc-400 font-medium">Cuidado y paseos de confianza</span>
            </div>
          </router-link>
        </div>

        <!-- Enlaces de Navegación Minimalistas -->
        <nav class="hidden md:flex items-center gap-8 font-semibold text-sm">
          <router-link
            to="/paseadores"
            class="text-amber-700 dark:text-amber-400 font-bold border-b-2 border-amber-600 dark:border-amber-400 py-1 transition-colors"
          >
            Explorar Paseadores
          </router-link>
          <a
            href="#beneficios"
            class="text-stone-600 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium"
          >
            Cómo funciona
          </a>
          <a
            href="#unete"
            class="text-stone-600 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium"
          >
            Sé un Paseador
          </a>
        </nav>

        <!-- Perfil / CTA derecho -->
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2.5 pl-4 border-l border-stone-200 dark:border-zinc-800">
            <div class="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center text-sm font-bold text-stone-700 dark:text-zinc-200 shadow-2xs">
              👤
            </div>
            <span class="text-xs font-bold text-stone-700 dark:text-zinc-300">Mi Cuenta</span>
          </div>
        </div>

      </div>
    </header>

    <!-- Contenido Principal (Router View) -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Pie de Página Minimalista -->
    <footer class="bg-white dark:bg-zinc-900 border-t border-stone-200 dark:border-zinc-800/80 py-12 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500 dark:text-zinc-400">
        <div class="flex items-center gap-3">
          <img :src="logo" alt="AllPets Mini" class="w-7 h-7 object-contain opacity-80 grayscale hover:grayscale-0 transition-all" />
          <span class="font-bold text-stone-700 dark:text-zinc-300">AllPets</span>
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
</style>
