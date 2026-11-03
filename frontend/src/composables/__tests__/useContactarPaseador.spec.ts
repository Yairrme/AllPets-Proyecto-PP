import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import type { Paseador } from '../../types/paseador'
import { useContactarPaseador } from '../useContactarPaseador'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/paseadores?rol=walker' }),
  useRouter: () => ({ push }),
}))

const paseador = (disponible = true) =>
  ({ id: 'p1', nombre: 'Ana López', rol: 'walker', disponible }) as Paseador

describe('useContactarPaseador', () => {
  const ventana = { opener: {}, location: { href: '' }, close: vi.fn() }

  beforeEach(() => {
    setActivePinia(createPinia())
    push.mockReset()
    ventana.close.mockReset()
    ventana.location.href = ''
    vi.spyOn(window, 'open').mockReturnValue(ventana as unknown as Window)
  })

  it('sin sesión lleva al login y vuelve a la misma pantalla', async () => {
    const { contactar } = useContactarPaseador()
    await contactar(paseador())
    expect(push).toHaveBeenCalledWith({
      name: 'login',
      query: { redirect: '/paseadores?rol=walker' },
    })
    expect(window.open).not.toHaveBeenCalled()
  })

  it('con sesión pide el teléfono y abre WhatsApp', async () => {
    useAuthStore().token = 't'
    vi.spyOn(useProfileStore(), 'fetchCaregiverContact').mockResolvedValue('+54 299 123')
    const { contactar } = useContactarPaseador()
    await contactar(paseador())
    expect(ventana.location.href).toContain('https://wa.me/54299123?text=')
    expect(ventana.opener).toBeNull()
  })

  it('si no toma clientes no consulta nada', async () => {
    useAuthStore().token = 't'
    const fetch = vi.spyOn(useProfileStore(), 'fetchCaregiverContact')
    const { contactar } = useContactarPaseador()
    await contactar(paseador(false))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('si falla cierra la ventana y muestra el error', async () => {
    useAuthStore().token = 't'
    vi.spyOn(useProfileStore(), 'fetchCaregiverContact').mockRejectedValue(new Error('sin permiso'))
    const { contactar, contactError } = useContactarPaseador()
    await contactar(paseador())
    expect(ventana.close).toHaveBeenCalled()
    expect(contactError.value).toBe('sin permiso')
  })
})
