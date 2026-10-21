import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Product } from '../types/shop'

const API_URL = 'http://localhost:3000'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const isLoading = ref(false)
  const error = ref('')

  async function fetchProducts() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await axios.get<Product[]>(`${API_URL}/products`)
      products.value = response.data
    } catch {
      // Sin datos inventados: si falla, se informa y se puede reintentar.
      products.value = []
      error.value = 'No pudimos cargar el catálogo. Intentá de nuevo en unos minutos.'
    } finally {
      isLoading.value = false
    }
  }

  return { products, isLoading, error, fetchProducts }
})
