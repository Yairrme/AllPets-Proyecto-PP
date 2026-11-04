<script setup lang="ts">
import { ref } from 'vue'
import PrivacyPolicyModal from './PrivacyPolicyModal.vue'

/**
 * Checkbox de aceptación de políticas de privacidad + enlace al texto completo.
 * Uso: <PrivacyPolicyField v-model="accepted" :error="errorMsg" />
 */
withDefaults(
  defineProps<{
    modelValue: boolean
    error?: string
    variant?: 'default' | 'worker'
    inputId?: string
  }>(),
  { error: '', variant: 'default', inputId: 'privacy-policy' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const isModalOpen = ref(false)
</script>

<template>
  <div>
    <div class="flex items-start gap-2.5">
      <input
        :id="inputId"
        type="checkbox"
        :checked="modelValue"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        class="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300"
        :class="variant === 'worker' ? 'accent-[#3F5B46]' : 'accent-indigo-600'"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <label :for="inputId" class="cursor-pointer text-sm text-gray-700">
        He leído y acepto las políticas de privacidad
      </label>
    </div>

    <button
      type="button"
      class="ml-[1.625rem] mt-1 text-sm font-semibold underline underline-offset-2"
      :class="variant === 'worker' ? 'text-[#3F5B46] hover:text-[#33473A]' : 'text-indigo-600 hover:text-indigo-800'"
      @click="isModalOpen = true"
    >
      Leer políticas de privacidad
    </button>

    <p
      v-if="error"
      :id="`${inputId}-error`"
      role="alert"
      class="ml-[1.625rem] mt-2 text-sm font-medium"
      :class="variant === 'worker' ? 'text-[#B15A34]' : 'text-red-700'"
    >
      {{ error }}
    </p>

    <PrivacyPolicyModal :open="isModalOpen" :variant="variant" @close="isModalOpen = false" />
  </div>
</template>
