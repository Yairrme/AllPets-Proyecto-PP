import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "axios";
import type { Product } from "../types/shop";

import { API_URL } from "../config";
import { getApiErrorMessage } from "../utils/apiError";

/** Los 7 campos editables de un producto (todo menos el _id). */
export type ProductInput = Omit<Product, "_id">;

const MENSAJES: Record<number, string> = {
  401: "Tu sesión venció. Volvé a iniciar sesión.",
  403: "No tenés permisos de administrador para esta acción.",
  404: "El producto ya no existe.",
  503: "La tienda no está disponible ahora. Intentá en unos minutos.",
};
const getErrorMessage = (error: unknown, fallback: string) =>
  getApiErrorMessage(error, fallback, MENSAJES);

const PAGE_SIZE = 24;

export type ProductSort = "relevancia" | "precio-asc" | "precio-desc";

/** Los filtros se resuelven en la API: en el navegador solo está lo ya cargado. */
export interface ProductFilters {
  q?: string;
  petType?: string;
  category?: string;
  sort?: ProductSort;
}

export interface ProductFacet {
  value: string;
  count: number;
}

interface ProductsResponse {
  data: Product[];
  pagination: { page: number; total: number; totalPages: number };
  facets: { petTypes: ProductFacet[]; categories: ProductFacet[] };
}

// El token JWT lo agrega el interceptor global de axios que configura el
// store de auth (axios.defaults.headers.common.Authorization).
export const useProductsStore = defineStore("products", () => {
  const products = ref<Product[]>([]);
  const total = ref(0);
  const page = ref(1);
  const totalPages = ref(1);
  const facets = ref<ProductsResponse["facets"]>({
    petTypes: [],
    categories: [],
  });
  const isLoadingMore = ref(false);
  const hayMas = computed(() => page.value < totalPages.value);
  let currentFilters: ProductFilters = {};
  // Si cambian los filtros mientras hay una petición en curso, gana la última.
  let lastRequest = 0;

  const request = (filters: ProductFilters, pageNumber: number) =>
    axios.get<ProductsResponse>(`${API_URL}/products`, {
      params: { ...filters, page: pageNumber, limit: PAGE_SIZE },
    });

  function applyPage(data: ProductsResponse) {
    total.value = data.pagination.total;
    page.value = data.pagination.page;
    totalPages.value = data.pagination.totalPages;
    facets.value = data.facets;
  }
  const isLoading = ref(false);
  const error = ref("");
  const isSaving = ref(false);
  const actionError = ref("");

  async function fetchProducts(filters: ProductFilters = {}) {
    const requestId = ++lastRequest;
    currentFilters = filters;
    isLoading.value = true;
    error.value = "";
    try {
      const { data } = await request(filters, 1);
      if (requestId !== lastRequest) return;
      products.value = data.data;
      applyPage(data);
    } catch {
      if (requestId !== lastRequest) return;
      // Sin datos inventados: si falla, se informa y se puede reintentar.
      products.value = [];
      total.value = 0;
      error.value =
        "No pudimos cargar el catálogo. Intentá de nuevo en unos minutos.";
    } finally {
      if (requestId === lastRequest) isLoading.value = false;
    }
  }

  async function fetchMore() {
    if (isLoadingMore.value || !hayMas.value) return;
    const requestId = lastRequest;
    isLoadingMore.value = true;
    try {
      const { data } = await request(currentFilters, page.value + 1);
      if (requestId !== lastRequest) return;
      products.value = [...products.value, ...data.data];
      applyPage(data);
    } catch {
      error.value =
        "No pudimos cargar el catálogo. Intentá de nuevo en unos minutos.";
    } finally {
      isLoadingMore.value = false;
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
      total.value += 1;
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

  /** Sube una foto desde la PC del admin; devuelve la ruta /uploads/... o null si falla. */
  async function uploadImage(file: File): Promise<string | null> {
    let imageUrl: string | null = null;
    await runAction(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post<{ imageUrl: string }>(
        `${API_URL}/products/image`,
        formData,
      );
      imageUrl = response.data.imageUrl;
    }, "No pudimos subir la foto.");
    return imageUrl;
  }

  const deleteProduct = (id: string) =>
    runAction(async () => {
      await axios.delete(`${API_URL}/products/${id}`);
      products.value = products.value.filter((p) => p._id !== id);
      total.value -= 1;
    }, "No pudimos eliminar el producto.");

  return {
    products,
    total,
    hayMas,
    facets,
    isLoading,
    isLoadingMore,
    error,
    isSaving,
    actionError,
    fetchProducts,
    fetchMore,
    createProduct,
    updateProduct,
    uploadImage,
    deleteProduct,
  };
});
