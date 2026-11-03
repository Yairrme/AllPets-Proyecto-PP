import { onBeforeUnmount, ref, watch } from 'vue'
import { useProfileStore } from '../stores/profile'

export interface CertificationDocument {
  filename: string
  url: string
}

/**
 * Los comprobantes son privados: un <img> no puede enviar el token, así que se
 * descargan con axios y se muestran con una URL local temporal.
 */
export function useCertificationDocuments(
  userId: () => string | undefined,
  filenames: () => string[],
) {
  const profileStore = useProfileStore()
  const documents = ref<CertificationDocument[]>([])
  const urls = new Map<string, string>()

  async function load() {
    const id = userId()
    const wanted = filenames()
    if (!id) return

    await Promise.all(
      wanted
        .filter((filename) => !urls.has(filename))
        .map(async (filename) => {
          try {
            const blob = await profileStore.fetchCertificationDocument(id, filename)
            urls.set(filename, URL.createObjectURL(blob))
          } catch (error) {
            console.error('Error al cargar un comprobante', error)
          }
        }),
    )

    for (const [filename, url] of urls) {
      if (!wanted.includes(filename)) {
        URL.revokeObjectURL(url)
        urls.delete(filename)
      }
    }
    documents.value = wanted.flatMap((filename) => {
      const url = urls.get(filename)
      return url ? [{ filename, url }] : []
    })
  }

  watch(() => [userId(), ...filenames()].join('|'), load, { immediate: true })

  onBeforeUnmount(() => {
    urls.forEach((url) => URL.revokeObjectURL(url))
    urls.clear()
  })

  return { documents }
}
