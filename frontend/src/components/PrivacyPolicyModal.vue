<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import PrivacyPolicyContent from './PrivacyPolicyContent.vue'
import { privacyPolicy } from '../content/privacyPolicy'

const props = withDefaults(defineProps<{ open: boolean; variant?: 'default' | 'worker' }>(), {
  variant: 'default',
})
const emit = defineEmits<{ (e: 'close'): void }>()

const dialogRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Esc cierra; Tab queda atrapado dentro del modal mientras está abierto
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return
  const nodes = Array.from(dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (nodes.length === 0) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      closeButtonRef.value?.focus()
    } else {
      document.body.style.overflow = ''
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      @keydown="onKeydown"
      @click.self="emit('close')"
    >
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
        class="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
      >
        <header class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="privacy-policy-title" class="text-lg font-bold text-gray-900">{{ privacyPolicy.title }}</h2>
          <button
            ref="closeButtonRef"
            type="button"
            aria-label="Cerrar políticas de privacidad"
            class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2"
            :class="variant === 'worker' ? 'focus:ring-[#3F5B46]' : 'focus:ring-indigo-600'"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                d="M4.28 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.66-4.72a.75.75 0 1 1 1.07 1.06L11.06 10l4.67 4.72a.75.75 0 1 1-1.07 1.06L10 11.06l-4.66 4.72a.75.75 0 1 1-1.07-1.06L8.94 10 4.28 5.28a.75.75 0 0 1 0-1.06Z"
              />
            </svg>
          </button>
        </header>

        <div class="overflow-y-auto px-5 py-4">
          <PrivacyPolicyContent />
        </div>

        <footer class="flex justify-end border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            class="rounded-md px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="
              variant === 'worker'
                ? 'bg-[#3F5B46] hover:bg-[#33473A] focus:ring-[#3F5B46]'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600'
            "
            @click="emit('close')"
          >
            Cerrar y volver al formulario
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
