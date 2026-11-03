import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import type { Paseador } from '../types/paseador'
import { whatsappLink } from '../utils/contact'

/**
 * Abre WhatsApp con el prestador. El teléfono solo se entrega con sesión: sin
 * ella se pasa por el login y se vuelve a la misma pantalla.
 */
export function useContactarPaseador() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const contactError = ref('')

  async function contactar(paseador: Paseador) {
    contactError.value = ''
    if (!paseador.disponible) return

    if (!authStore.isAuthenticated) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }

    // Se abre antes de esperar la respuesta: los navegadores bloquean las
    // ventanas que no salen directamente de un clic.
    const ventana = window.open('', '_blank')
    try {
      const phone = await profileStore.fetchCaregiverContact(paseador.id)
      const link = phone ? whatsappLink(paseador, phone) : null
      if (!link) throw new Error('Este prestador todavía no cargó su teléfono.')

      if (ventana) {
        ventana.opener = null
        ventana.location.href = link
      } else {
        window.location.href = link
      }
    } catch (error: any) {
      ventana?.close()
      contactError.value = error.message || 'No pudimos obtener el teléfono.'
    }
  }

  return { contactar, contactError }
}
