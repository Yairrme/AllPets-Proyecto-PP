import type { Router } from 'vue-router'

const CHUNK_ERROR = /dynamically imported module|Importing a module script|preload CSS/i
const STORAGE_KEY = 'chunk-reload'

/**
 * Las vistas se cargan al entrar. Al publicar una versión nueva cambian los nombres
 * de esos archivos y una pestaña abierta ya no los encuentra: se recarga la página
 * una sola vez para traer la versión nueva. Si vuelve a fallar no se insiste.
 */
export function setupChunkReload(router: Router) {
  router.onError((error, to) => {
    if (!CHUNK_ERROR.test(String(error?.message))) return
    console.error('No se pudo cargar la vista', error)
    if (sessionStorage.getItem(STORAGE_KEY) === to.fullPath) return
    sessionStorage.setItem(STORAGE_KEY, to.fullPath)
    window.location.assign(to.fullPath)
  })
  router.afterEach(() => sessionStorage.removeItem(STORAGE_KEY))
}
