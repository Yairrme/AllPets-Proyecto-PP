import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfileStore } from '../profile'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('useProfileStore: reseña propia', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('devuelve null si el cliente todavía no dejó una', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { review: null } })
    await expect(useProfileStore().fetchMyReview('c1')).resolves.toBeNull()
  })

  it('al crear no envía el autor: sale del token', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { _id: 'r1' } })
    await useProfileStore().createReview({ caregiver_id: 'c1', score: 5 })
    expect(vi.mocked(axios.post).mock.calls[0]?.[1]).toEqual({ caregiver_id: 'c1', score: 5 })
  })

  it('al eliminar la quita de la lista', async () => {
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })
    const store = useProfileStore()
    store.reviews = [{ _id: 'r1' }, { _id: 'r2' }]
    await store.deleteReview('r1')
    expect(store.reviews).toEqual([{ _id: 'r2' }])
  })

  it('si el servidor rechaza la edición muestra su mensaje', async () => {
    vi.mocked(axios.patch).mockRejectedValue({
      response: { status: 404, data: { message: 'Reseña no encontrada' } },
    })
    await expect(
      useProfileStore().updateReview('r1', { score: 3, comment: '' }),
    ).rejects.toThrow('Reseña no encontrada')
  })
})
