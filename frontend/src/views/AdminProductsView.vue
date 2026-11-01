<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useProductsStore, type ProductInput } from "../stores/products";
import type { Product } from "../types/shop";

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

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    value,
  );

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
  if (imageUrl.length === 0 || imageUrl.length > 500)
    return "La URL de la imagen es obligatoria (máximo 500 caracteres).";
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
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div
      class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-stone-900">
          Administrar productos
        </h1>
        <p class="text-stone-500 mt-1">
          Creá, editá y eliminá los productos de la tienda.
        </p>
      </div>
      <button
        class="rounded-xl bg-amber-500 text-white font-bold px-5 py-2.5 hover:bg-amber-600 active:scale-95 transition"
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
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
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
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
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
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
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
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
        Tipo de mascota
        <input
          v-model="form.petType"
          type="text"
          maxlength="60"
          placeholder="perro"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm font-semibold text-stone-700">
        Categoría
        <input
          v-model="form.category"
          type="text"
          maxlength="60"
          placeholder="alimento"
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </label>

      <label
        class="flex flex-col gap-1 text-sm font-semibold text-stone-700 sm:col-span-2"
      >
        URL de la imagen
        <input
          v-model="form.imageUrl"
          type="text"
          maxlength="500"
          placeholder="https://..."
          class="px-3 py-2 rounded-xl border border-stone-300 font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </label>

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
          class="rounded-xl bg-amber-500 text-white font-bold px-5 py-2.5 hover:bg-amber-600 active:scale-95 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
          :disabled="productsStore.isSaving"
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
                :src="product.imageUrl"
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
            <td class="px-4 py-3 font-bold text-amber-700">
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
                  class="font-bold text-indigo-600 hover:text-indigo-800 mr-3"
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
    </div>
  </section>
</template>
