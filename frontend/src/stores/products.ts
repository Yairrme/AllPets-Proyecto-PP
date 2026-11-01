import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import type { Product } from "../types/shop";

const API_URL = "http://localhost:3000";

/** Los 7 campos editables de un producto (todo menos el _id). */
export type ProductInput = Omit<Product, "_id">;

/** Convierte un error de axios en un mensaje para mostrarle al usuario. */
function getErrorMessage(error: unknown, fallback: string): string {
  const response = (
    error as { response?: { status?: number; data?: { message?: unknown } } }
  )?.response;
  if (response?.status === 401)
    return "Tu sesión venció. Volvé a iniciar sesión.";
  if (response?.status === 403)
    return "No tenés permisos de administrador para esta acción.";
  if (response?.status === 404) return "El producto ya no existe.";
  if (response?.status === 503)
    return "La tienda no está disponible ahora. Intentá en unos minutos.";
  const message = response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return fallback;
}

// El token JWT lo agrega el interceptor global de axios que configura el
// store de auth (axios.defaults.headers.common.Authorization).
export const useProductsStore = defineStore("products", () => {
  const products = ref<Product[]>([]);
  const isLoading = ref(false);
  const error = ref("");
  const isSaving = ref(false);
  const actionError = ref("");

  async function fetchProducts() {
    isLoading.value = true;
    error.value = "";
    try {
      const response = await axios.get<Product[]>(`${API_URL}/products`);
      products.value = response.data;
    } catch {
      // Sin datos inventados: si falla, se informa y se puede reintentar.
      products.value = [];
      error.value =
        "No pudimos cargar el catálogo. Intentá de nuevo en unos minutos.";
    } finally {
      isLoading.value = false;
    }
  }

  async function runAction(
    action: () => Promise<void>,
    fallback: string,
  ): Promise<boolean> {
    isSaving.value = true;
    actionError.value = "";
    try {
      await action();
      return true;
    } catch (e) {
      actionError.value = getErrorMessage(e, fallback);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  const createProduct = (data: ProductInput) =>
    runAction(async () => {
      const response = await axios.post<Product>(`${API_URL}/products`, data);
      products.value = [...products.value, response.data];
    }, "No pudimos crear el producto.");

  const updateProduct = (id: string, data: Partial<ProductInput>) =>
    runAction(async () => {
      const response = await axios.patch<Product>(
        `${API_URL}/products/${id}`,
        data,
      );
      products.value = products.value.map((p) =>
        p._id === id ? response.data : p,
      );
    }, "No pudimos guardar los cambios.");

  const deleteProduct = (id: string) =>
    runAction(async () => {
      await axios.delete(`${API_URL}/products/${id}`);
      products.value = products.value.filter((p) => p._id !== id);
    }, "No pudimos eliminar el producto.");

  return {
    products,
    isLoading,
    error,
    isSaving,
    actionError,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
});
