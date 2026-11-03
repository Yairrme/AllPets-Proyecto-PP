<script setup lang="ts">
import heroPetsImg from '../../assets/hero-pets.jpg'

withDefaults(
  defineProps<{
    /** En /paseadores la ubicación ya aparece junto a la marca, arriba. */
    showLocation?: boolean
    /** Imagen de la derecha (por defecto, la foto del perro y el gato). */
    image?: string
    /** Versión para modo oscuro (opcional). Si no se pasa, se usa `image` en los dos modos. */
    imageDark?: string
    imageAlt?: string
    /**
     * 'cover' llena el recuadro (fotos). 'contain' muestra la imagen entera
     * sobre fondo blanco (ilustraciones como el logo, que no se deben recortar).
     */
    imageFit?: 'cover' | 'contain'
  }>(),
  {
    showLocation: true,
    image: heroPetsImg,
    imageAlt: 'Perro y gato juntos en AllPets',
    imageFit: 'cover',
  },
)

/** Presentación de la sección de paseadores y cuidadores (la usan la página de inicio y /paseadores). */
const pasos = [
  'Elegí tu ciudad y compará perfiles.',
  'Revisá experiencia, tarifa y reseñas.',
  'Contactá directamente al trabajador.',
]
</script>

<template>
  <div class="relative pb-14 mb-14 border-b border-(--color-line)">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-center">
      <div class="space-y-8">
        <div class="max-w-xl">
          <p v-if="showLocation" class="mb-3 text-sm text-(--color-ink)/50">AllPets</p>
          <h1 class="hero-serif text-[2.5rem] sm:text-[3.5rem] leading-[1.05] font-semibold mb-5">
            Encontrá el paseador ideal para tu mascota
          </h1>
          <p class="text-base sm:text-lg text-(--color-ink)/70 leading-relaxed max-w-lg">
            Paseadores y cuidadores verificados en Cipolletti y Neuquén. Mirá su perfil, consultá la
            tarifa y contactalos por WhatsApp.
          </p>
        </div>

        <ol class="grid max-w-lg grid-cols-1 gap-3.5 text-sm sm:text-base text-(--color-ink)/75">
          <li
            v-for="(paso, index) in pasos"
            :key="paso"
            class="flex items-center gap-3.5"
            :class="{ 'border-b border-(--color-line) pb-3.5': index < pasos.length - 1 }"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-forest) text-(--color-paper) font-semibold"
              >{{ index + 1 }}</span
            >
            <span>{{ paso }}</span>
          </li>
        </ol>
      </div>

      <div class="relative mx-auto w-full">
        <div
          class="overflow-hidden rounded-3xl border border-(--color-line) shadow-lg h-[340px] sm:h-[430px] lg:h-[490px]"
          :class="{ 'bg-[#fff]': imageFit === 'contain' }"
        >
          <!-- Con imageDark, cada imagen se muestra solo en su modo (variante dark: de Tailwind) -->
          <img
            :src="image"
            :alt="imageAlt"
            class="h-full w-full object-center"
            :class="[
              imageFit === 'contain' ? 'keep-bright object-contain p-8 sm:p-12' : 'object-cover',
              { 'dark:hidden': imageDark },
            ]"
          />
          <img
            v-if="imageDark"
            :src="imageDark"
            :alt="imageAlt"
            class="keep-bright hidden h-full w-full object-center dark:block"
            :class="imageFit === 'contain' ? 'object-contain p-8 sm:p-12' : 'object-cover'"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.hero-serif {
  font-family: 'Fraunces', ui-serif, Georgia, serif;
}
</style>
