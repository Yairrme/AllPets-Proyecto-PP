<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { toApiUrl } from "../config";
import { useProductsStore, type ProductInput } from "../stores/products";
import type { Product } from "../types/shop";
import { formatARS } from "../utils/currency";

interface ProductForm {
  title: string;
  description: string;
  price: number | "";
  petType: string;
  category: string;
  imageUrl: string;
  stock: number | "";
}

const productsStore = useProductsStore();

const showForm = ref(false);
const editingId = ref<string | null>(null);
const formError = ref("");
const pendingDeleteId = ref<string | null>(null);
const feedback = ref<{ type: "ok" | "error"; text: string } | null>(null);

const emptyForm = (): ProductForm => ({
  title: "",
  description: "",
  price: "",
  petType: "",
  category: "",
  imageUrl: "",
  stock: "",
});

const form = reactive<ProductForm>(emptyForm());

onMounted(() => {
  productsStore.fetchProducts();
});

const formatPrice = formatARS;

// ---- Foto del producto: subida desde la PC o URL pública ----
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const isUploadingImage = ref(false);
const imageError = ref("");

const imagePreview = computed(() =>
  form.imageUrl.trim() ? toApiUrl(form.imageUrl.trim()) : "",
);

async function handleImageFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // permite volver a elegir el mismo archivo
  if (!file) return;

  imageError.value = "";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    imageError.value = "Solo se aceptan imágenes JPG, PNG o WEBP.";
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    imageError.value = "La imagen no puede superar 5 MB.";
    return;
  }

  isUploadingImage.value = true;
  const imageUrl = await productsStore.uploadImage(file);
  isUploadingImage.value = false;
  if (imageUrl) {
    form.imageUrl = imageUrl;
  } else {
    imageError.value = productsStore.actionError;
  }
}

function openCreate() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  formError.value = "";
  feedback.value = null;
  showForm.value = true;
}

function openEdit(product: Product) {
  Object.assign(form, {
    title: product.title,
    description: product.description,
    price: product.price,
    petType: product.petType,
    category: product.category,
    imageUrl: product.imageUrl,
    stock: product.stock,
  });
  editingId.value = product._id;
  formError.value = "";
  feedback.value = null;
  pendingDeleteId.value = null;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  formError.value = "";
  imageError.value = "";
}

/** Mismas reglas que CreateProductDto en el backend (el backend vuelve a validar). */
function validate(): string {
  const title = form.title.trim();
  const description = form.description.trim();
  const petType = form.petType.trim();
  const category = form.category.trim();
  const imageUrl = form.imageUrl.trim();
  const price = Number(form.price);
  const stock = Number(form.stock);

  if (title.length < 2 || title.length > 120)
    return "El título debe tener entre 2 y 120 caracteres.";
  if (description.length < 2 || description.length > 1000)
    return "La descripción debe tener entre 2 y 1000 caracteres.";
  if (
    form.price === "" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 10_000_000
  )
    return "El precio debe ser un número entre 0 y 10.000.000.";
  if (Math.round(price * 100) / 100 !== price)
    return "El precio admite hasta 2 decimales.";
  if (petType.length === 0 || petType.length > 60)
    return "El tipo de mascota es obligatorio (máximo 60 caracteres).";
  if (category.length === 0 || category.length > 60)
    return "La categoría es obligatoria (máximo 60 caracteres).";
  if (imageUrl.length === 0)
    return "Subí una foto del producto o pegá la URL de una imagen.";
  if (imageUrl.length > 500 || !/^(https?:\/\/|\/uploads\/)/i.test(imageUrl))
    return "La imagen debe ser una foto subida o una URL que empiece con http:// o https://.";
  if (
    form.stock === "" ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    stock > 1_000_000
  )
    return "El stock debe ser un entero entre 0 y 1.000.000.";
  return "";
}

function buildPayload(): ProductInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    petType: form.petType.trim(),
    category: form.category.trim(),
    imageUrl: form.imageUrl.trim(),
    stock: Number(form.stock),
  };
}

async function submit() {
  formError.value = validate();
  if (formError.value) return;

  const payload = buildPayload();
  const isEditing = editingId.value !== null;
  const ok = isEditing
    ? await productsStore.updateProduct(editingId.value as string, payload)
    : await productsStore.createProduct(payload);

  if (ok) {
    feedback.value = {
      type: "ok",
      text: isEditing
        ? `"${payload.title}" actualizado.`
        : `"${payload.title}" creado.`,
    };
    closeForm();
  } else {
    formError.value = productsStore.actionError;
  }
}

async function confirmDelete(product: Product) {
  const ok = await productsStore.deleteProduct(product._id);
  pendingDeleteId.value = null;
  feedback.value = ok
    ? { type: "ok", text: `"${product.title}" eliminado.` }
    : { type: "error", text: productsStore.actionError };
}
</script>

<template>
  <section>
    <div
      class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
    >
      <div>
        <h2 class="text-2xl font-extrabold tracking-tight text-stone-900">
          Productos
        </h2>
        <p class="text-stone-500 mt-1">
          Creá, editá y eliminá los productos de la tienda.
        </p>
      </div>
      <button
        class="rounded-xl bg-(--brand) text-white font-bold px-5 py-2.5 hover:bg-(--brand-dark) active:scale-95 transition"
        @click="openCreate"
      >
        + Nuevo producto
      </button>
    </div>

    <p
      v-if="feedback"
      role="status"
      class="mb-6 px-4 py-3 rounded-xl text-sm font-medium border"
      :class="
        feedback.type === 'ok'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      "
    >
      {{ feedback.text }}
    </p>

    <!-- Formulario de alta / edición -->
    <form
      v-if="showForm"
      class="mb-8 bg-white rounded-2xl border border-stone-200 shadow-xs p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      @submit.prevent="submit"
    >
      <h2 class="sm:col-span-2 text-lg font-bold text-stone-900">
        {{ editingId ? "Editar producto" : "Nuevo producto" }}
      </h2>

      <label
        class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
      >
        Título
        <input
          v-model="form.title"
          type="text"
          maxlength="120"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
        />
      </label>

      <label
        class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
      >
        Descripción
        <textarea
          v-model="form.description"
          rows="3"
          maxlength="1000"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
        Precio (ARS)
        <input
          v-model.number="form.price"
          type="number"
          min="0"
          max="10000000"
          step="0.01"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
        Stock
        <input
          v-model.number="form.stock"
          type="number"
          min="0"
          max="1000000"
          step="1"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
        Tipo de mascota
        <input
          v-model="form.petType"
          type="text"
          maxlength="60"
          placeholder="perro"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
        Categoría
        <input
          v-model="form.category"
          type="text"
          maxlength="60"
          placeholder="alimento"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
        />
      </label>

      <fieldset class="sm:col-span-2">
        <legend class="text-sm font-semibold text-stone-700 mb-2">
          Foto del producto
        </legend>
        <div class="flex flex-col sm:flex-row gap-4 items-start">
          <div
            class="w-32 h-32 shrink-0 rounded-xl border border-stone-200 bg-stone-100 overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="imagePreview"
              :src="imagePreview"
              alt="Vista previa de la foto"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl text-stone-400" aria-hidden="true"
              >🖼️</span
            >
          </div>

          <div class="flex-1 w-full space-y-3">
            <label
              class="inline-flex items-center gap-2 rounded-xl border border-(--brand) text-(--header-accent) font-bold px-4 py-2 cursor-pointer hover:bg-(--header-hover) transition"
              :class="{ 'opacity-50 pointer-events-none': isUploadingImage }"
            >
              {{
                isUploadingImage
                  ? "Subiendo..."
                  : form.imageUrl
                    ? "Cambiar foto"
                    : "Subir foto"
              }}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                :disabled="isUploadingImage"
                @change="handleImageFile"
              />
            </label>
            <p class="text-xs text-stone-500">JPG, PNG o WEBP de hasta 5 MB.</p>

            <label
              class="flex flex-col gap-1 text-xs font-semibold text-stone-500"
            >
              O pegá la URL de una imagen
              <input
                v-model="form.imageUrl"
                type="text"
                maxlength="500"
                placeholder="https://..."
                class="px-3 py-2 rounded-xl border border-stone-300 text-sm font-normal text-stone-800 focus:outline-none focus:ring-2 focus:ring-(--brand)/30 focus:border-(--brand)"
              />
            </label>

            <p v-if="imageError" role="alert" class="text-sm text-red-600">
              {{ imageError }}
            </p>
          </div>
        </div>
      </fieldset>

      <p
        v-if="formError"
        role="alert"
        class="sm:col-span-2 px-4 py-3 rounded-xl text-sm font-medium border bg-red-50 text-red-700 border-red-200"
      >
        {{ formError }}
      </p>

      <div class="sm:col-span-2 flex gap-3 justify-end">
        <button
          type="button"
          class="rounded-xl border border-stone-300 text-stone-700 font-bold px-5 py-2.5 hover:bg-stone-100 transition"
          :disabled="productsStore.isSaving"
          @click="closeForm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-xl bg-(--brand) text-white font-bold px-5 py-2.5 hover:bg-(--brand-dark) active:scale-95 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
          :disabled="productsStore.isSaving || isUploadingImage"
        >
          {{
            productsStore.isSaving
              ? "Guardando..."
              : editingId
                ? "Guardar cambios"
                : "Crear producto"
          }}
        </button>
      </div>
    </form>

    <!-- Listado -->
    <p v-if="productsStore.isLoading" class="text-stone-500">
      Cargando productos...
    </p>

    <div
      v-else-if="productsStore.error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
    >
      <p>{{ productsStore.error }}</p>
      <button
        class="mt-3 text-sm font-bold underline"
        @click="productsStore.fetchProducts()"
      >
        Reintentar
      </button>
    </div>

    <p v-else-if="productsStore.products.length === 0" class="text-stone-500">
      Todavía no hay productos cargados.
    </p>

    <div
      v-else
      class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-x-auto"
    >
      <table class="min-w-full text-sm">
        <thead class="bg-stone-50 text-stone-600 text-left">
          <tr>
            <th class="px-4 py-3 font-bold">Imagen</th>
            <th class="px-4 py-3 font-bold">Título</th>
            <th class="px-4 py-3 font-bold">Mascota / Categoría</th>
            <th class="px-4 py-3 font-bold">Precio</th>
            <th class="px-4 py-3 font-bold">Stock</th>
            <th class="px-4 py-3 font-bold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="product in productsStore.products" :key="product._id">
            <td class="px-4 py-3">
              <img
                :src="toApiUrl(product.imageUrl)"
                :alt="product.title"
                class="w-14 h-14 rounded-lg object-cover bg-stone-100"
              />
            </td>
            <td class="px-4 py-3 max-w-xs">
              <p class="font-bold text-stone-900">{{ product.title }}</p>
              <p class="text-stone-500 truncate">{{ product.description }}</p>
            </td>
            <td class="px-4 py-3 text-stone-700">
              {{ product.petType }} / {{ product.category }}
            </td>
            <td class="px-4 py-3 font-bold text-(--header-accent)">
              {{ formatPrice(product.price) }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="
                  product.stock === 0
                    ? 'font-bold text-red-600'
                    : 'text-stone-700'
                "
              >
                {{ product.stock }}
              </span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <template v-if="pendingDeleteId === product._id">
                <span class="mr-2 text-stone-600">¿Eliminar?</span>
                <button
                  class="font-bold text-red-600 hover:text-red-800 mr-3 disabled:text-stone-400"
                  :disabled="productsStore.isSaving"
                  @click="confirmDelete(product)"
                >
                  Sí, eliminar
                </button>
                <button
                  class="font-bold text-stone-600 hover:text-stone-800"
                  @click="pendingDeleteId = null"
                >
                  Cancelar
                </button>
              </template>
              <template v-else>
                <button
                  class="font-bold text-(--header-accent) hover:text-(--header-text) mr-3"
                  @click="openEdit(product)"
                >
                  Editar
                </button>
                <button
                  class="font-bold text-red-600 hover:text-red-800"
                  @click="pendingDeleteId = product._id"
                >
                  Eliminar
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="productsStore.hayMas" class="border-t border-stone-200 p-4 text-center">
        <button
          type="button"
          class="text-sm font-bold underline disabled:opacity-50"
          :disabled="productsStore.isLoadingMore"
          @click="productsStore.fetchMore()"
        >
          {{ productsStore.isLoadingMore ? "Cargando..." : `Ver más (${productsStore.products.length} de ${productsStore.total})` }}
        </button>
      </div>
    </div>
  </section>
</template>
