import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Cart } from '../types/shop'

const API_URL = 'http://localhost:3000'

const EMPTY_CART: Cart = { items: [], totalItems: 0, total: 0 }

/** Convierte un error de axios en un mensaje para mostrarle al usuario. */
function getErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { status?: number; data?: { message?: unknown } } })
    ?.response
  if (response?.status === 401) return 'Tu sesión venció. Volvé a iniciar sesión.'
  if (response?.status === 503) return 'La tienda no está disponible ahora. Intentá en unos minutos.'
  const message = response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

// El token JWT lo agrega el interceptor global de axios que configura el
// store de auth (axios.defaults.headers.common.Authorization).
export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart>({ ...EMPTY_CART })
  const isLoading = ref(false)
  const error = ref('')

  async function run(action: () => Promise<{ data: Cart }>, fallback: string): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    try {
      cart.value = (await action()).data
      return true
    } catch (e) {
      error.value = getErrorMessage(e, fallback)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const fetchCart = () =>
    run(() => axios.get<Cart>(`${API_URL}/cart`), 'No pudimos cargar tu carrito.')

  const addItem = (productId: string, quantity = 1) =>
    run(
      () => axios.post<Cart>(`${API_URL}/cart/items`, { productId, quantity }),
      'No pudimos agregar el producto.',
    )

  const updateQuantity = (productId: string, quantity: number) =>
    run(
      () => axios.patch<Cart>(`${API_URL}/cart/items/${productId}`, { quantity }),
      'No pudimos cambiar la cantidad.',
    )

  const removeItem = (productId: string) =>
    run(
      () => axios.delete<Cart>(`${API_URL}/cart/items/${productId}`),
      'No pudimos quitar el producto.',
    )

  const clear = () =>
    run(() => axios.delete<Cart>(`${API_URL}/cart`), 'No pudimos vaciar el carrito.')

  /** Al cerrar sesión: el carrito en memoria no debe quedar para el próximo usuario. */
  function reset() {
    cart.value = { ...EMPTY_CART }
    error.value = ''
  }

  return { cart, isLoading, error, fetchCart, addItem, updateQuantity, removeItem, clear, reset }
})
