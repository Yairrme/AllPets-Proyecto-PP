<script setup lang="ts">
import { privacyPolicy, type PrivacyPolicyDocument } from '../content/privacyPolicy'

/**
 * Muestra el texto completo de las políticas de privacidad.
 * Reutilizable (modal, página propia, etc.). El contenido se edita en
 * src/content/privacyPolicy.ts.
 */
withDefaults(defineProps<{ policy?: PrivacyPolicyDocument }>(), {
  policy: () => privacyPolicy,
})
</script>

<template>
  <article class="text-sm leading-relaxed text-gray-700">
    <p class="text-xs text-gray-500">
      Versión {{ policy.version }}
      <template v-if="policy.lastUpdated"> · Última actualización: {{ policy.lastUpdated }}</template>
    </p>

    <p class="mt-3">{{ policy.intro }}</p>

    <section v-for="(section, i) in policy.sections" :key="section.id" class="mt-6">
      <h3 class="text-base font-semibold text-gray-900">{{ i + 1 }}. {{ section.title }}</h3>
      <p v-for="(paragraph, j) in section.paragraphs" :key="j" class="mt-2">{{ paragraph }}</p>
      <ul v-if="section.items?.length" class="mt-2 list-disc space-y-1.5 pl-5">
        <li v-for="(item, k) in section.items" :key="k">{{ item }}</li>
      </ul>
    </section>
  </article>
</template>
