// URL del API Gateway: el único punto de entrada al backend (ver docs/ANCLA.md).
// Se configura con VITE_API_URL en frontend/.env (ver .env.example).
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/** WhatsApp de la tienda: recibe los pedidos del carrito. Se configura con VITE_WHATSAPP_NUMBER. */
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5492984946246'

/** Convierte una ruta de /uploads del backend en una URL absoluta. */
export function toApiUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
