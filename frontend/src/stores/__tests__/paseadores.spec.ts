import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePaseadoresStore } from '../paseadores'

vi.mock('axios', () => ({ default: { get: vi.fn() } }))
const get = vi.mocked(axios.get)

const user = (id: string) => ({
  _id: id,
  name: id,
  role: 'walker',
  city: 'Neuquén',
  profile: { hourly_rate: 5000 },
})
const page = (ids: string[], current = 1, total = ids.length, totalPages = 1) => ({
  data: { data: ids.map(user), pagination: { page: current, total, totalPages } },
})

describe('usePaseadoresStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    get.mockReset()
  })

  it('manda los filtros a la API y omite los que no se usan', async () => {
    get.mockResolvedValue(page(['a']))
    const store = usePaseadoresStore()
    store.setFiltros({ busqueda: ' ana ', zona: 'Neuquén', soloDisponibles: true })
    await store.fetchPaseadores()

    expect(get.mock.calls[0]?.[1]?.params).toEqual({
      q: 'ana',
      city: 'Neuquén',
      available: true,
      page: 1,
      limit: 12,
    })
  })

  it('el total viene del servidor, no de lo cargado', async () => {
    get.mockResolvedValue(page(['a', 'b'], 1, 40, 4))
    const store = usePaseadoresStore()
    await store.fetchPaseadores()
    expect(store.paseadores).toHaveLength(2)
    expect(store.total).toBe(40)
    expect(store.hayMas).toBe(true)
  })

  it('"ver más" agrega la página siguiente', async () => {
    get.mockResolvedValueOnce(page(['a'], 1, 2, 2))
    const store = usePaseadoresStore()
    await store.fetchPaseadores()

    get.mockResolvedValueOnce(page(['b'], 2, 2, 2))
    await store.fetchMas()

    expect(get.mock.calls[1]?.[1]?.params).toMatchObject({ page: 2 })
    expect(store.paseadores.map((p) => p.id)).toEqual(['a', 'b'])
    expect(store.hayMas).toBe(false)
  })

  it('si cambian los filtros, una respuesta vieja no pisa a la nueva', async () => {
    let resolveFirst!: (value: unknown) => void
    get.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
    const store = usePaseadoresStore()
    const first = store.fetchPaseadores()

    get.mockResolvedValueOnce(page(['nueva']))
    await store.fetchPaseadores()

    resolveFirst(page(['vieja']))
    await first

    expect(store.paseadores.map((p) => p.id)).toEqual(['nueva'])
    expect(store.isLoading).toBe(false)
  })

  it('si falla informa el error y no deja datos anteriores', async () => {
    get.mockResolvedValueOnce(page(['a']))
    const store = usePaseadoresStore()
    await store.fetchPaseadores()

    get.mockRejectedValueOnce(new Error('caído'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await store.fetchPaseadores()

    expect(store.paseadores).toEqual([])
    expect(store.error).not.toBe('')
  })
})
