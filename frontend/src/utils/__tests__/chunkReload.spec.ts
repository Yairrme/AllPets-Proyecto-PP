import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import { setupChunkReload } from '../chunkReload'

describe('setupChunkReload', () => {
  const assign = vi.fn()
  let onError: (error: Error, to: { fullPath: string }) => void
  let afterEach: () => void

  beforeEach(() => {
    assign.mockReset()
    sessionStorage.clear()
    vi.stubGlobal('location', { assign })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setupChunkReload({
      onError: (fn: typeof onError) => (onError = fn),
      afterEach: (fn: typeof afterEach) => (afterEach = fn),
    } as unknown as Router)
  })

  const chunkError = new Error('Failed to fetch dynamically imported module: /assets/x.js')

  it('si falla la carga de una vista, recarga hacia esa ruta', () => {
    onError(chunkError, { fullPath: '/tienda?q=a' })
    expect(assign).toHaveBeenCalledWith('/tienda?q=a')
  })

  it('si vuelve a fallar no entra en un bucle de recargas', () => {
    onError(chunkError, { fullPath: '/tienda' })
    onError(chunkError, { fullPath: '/tienda' })
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('tras navegar bien, una publicación posterior puede volver a recargar', () => {
    onError(chunkError, { fullPath: '/tienda' })
    afterEach()
    onError(chunkError, { fullPath: '/tienda' })
    expect(assign).toHaveBeenCalledTimes(2)
  })

  it('otros errores de navegación no recargan', () => {
    onError(new Error('fallo de un guard'), { fullPath: '/tienda' })
    expect(assign).not.toHaveBeenCalled()
  })
})
