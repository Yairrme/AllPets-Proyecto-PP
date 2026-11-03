import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { getApiErrorMessage } from '../apiError'
import { setupSessionInterceptor } from '../sessionInterceptor'

describe('setupSessionInterceptor', () => {
  const push = vi.fn()
  let interceptor: number

  /** Una petición real de axios cuya respuesta es un error con ese código. */
  const reject = (url: string, status: number) =>
    axios.get(url, {
      adapter: (config) => Promise.reject({ config, response: { status } }),
    })

  beforeEach(() => {
    setActivePinia(createPinia())
    push.mockReset()
    localStorage.clear()
    useAuthStore().token = 'token'
    interceptor = setupSessionInterceptor({ push } as unknown as Router)
  })
  afterEach(() => axios.interceptors.response.eject(interceptor))

  it('un 401 cierra la sesión y lleva al login', async () => {
    await expect(reject('/cart', 401)).rejects.toBeDefined()
    expect(useAuthStore().token).toBeNull()
    expect(push).toHaveBeenCalledWith({ name: 'login', query: { expired: '1' } })
  })

  it('credenciales incorrectas en el login no redirigen', async () => {
    await expect(reject('/auth/login', 401)).rejects.toBeDefined()
    expect(useAuthStore().token).toBe('token')
    expect(push).not.toHaveBeenCalled()
  })

  it('otros errores no cierran la sesión', async () => {
    await expect(reject('/cart', 500)).rejects.toBeDefined()
    expect(useAuthStore().token).toBe('token')
  })
})

describe('getApiErrorMessage', () => {
  const error = (status: number, message?: unknown) => ({ response: { status, data: { message } } })

  it('prioriza el texto propio de la pantalla para ese código', () => {
    expect(getApiErrorMessage(error(503, 'x'), 'f', { 503: 'propio' })).toBe('propio')
  })
  it('une los mensajes de validación', () => {
    expect(getApiErrorMessage(error(400, ['a', 'b']), 'f')).toBe('a, b')
  })
  it('usa el respaldo sin respuesta del servidor', () => {
    expect(getApiErrorMessage(new Error('red'), 'f')).toBe('f')
  })
})
