<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useCartStore } from "../stores/cart";

const cartStore = useCartStore();

onMounted(() => {
  cartStore.fetchCart();
});

const items = computed(() => cartStore.cart.items);
const hasUnavailable = computed(() => items.value.some((i) => !i.hasStock));

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    value,
  );
const WHATSAPP_NUMBER = "5492984946246"; // ← número real

function checkoutWhatsApp() {
  if (!items.value.length) return;

  const lines = items.value.map(
    (i) => `• ${i.title} x${i.quantity} — ${formatPrice(i.subtotal)}`,
  );
  const text = [
    "Hola! Quiero hacer un pedido en AllPets:",
    "",
    ...lines,
    "",
    `Total: ${formatPrice(cartStore.cart.total)}`,
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}
</script>

<template>
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-extrabold tracking-tight text-stone-900 mb-8">
      Mi carrito
    </h1>

    <p
      v-if="cartStore.error"
      role="alert"
      class="mb-6 px-4 py-3 rounded-xl text-sm font-medium border bg-red-50 text-red-700 border-red-200"
    >
      {{ cartStore.error }}
    </p>

    <p v-if="cartStore.isLoading && items.length === 0" class="text-stone-500">
      Cargando...
    </p>

    <div
      v-else-if="items.length === 0"
      class="rounded-2xl border border-stone-200 bg-white p-10 text-center"
    >
      <p class="text-stone-600">Tu carrito está vacío.</p>
      <RouterLink
        to="/tienda"
        class="inline-block mt-4 rounded-xl bg-amber-500 text-white font-bold px-5 py-2.5 hover:bg-amber-600"
      >
        Ir a la tienda
      </RouterLink>
    </div>

    <template v-else>
      <ul class="space-y-4">
        <li
          v-for="item in items"
          :key="item.productId"
          class="flex gap-4 bg-white rounded-2xl border border-stone-200 p-4"
        >
          <img
            :src="item.imageUrl"
            :alt="item.title"
            class="w-24 h-24 rounded-xl object-cover bg-stone-100"
          />
          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-stone-900">{{ item.title }}</h2>
            <p class="text-sm text-stone-500">
              {{ formatPrice(item.price) }} c/u
            </p>
            <p
              v-if="!item.hasStock"
              class="text-sm font-bold text-red-600 mt-1"
            >
              {{
                item.stock === 0 ? "Sin stock" : `Quedan solo ${item.stock}`
              }}. Ajustá la cantidad.
            </p>
            <div class="mt-3 flex items-center gap-3">
              <button
                class="w-8 h-8 rounded-lg border border-stone-300 font-bold hover:bg-stone-100 disabled:opacity-40"
                :disabled="cartStore.isLoading || item.quantity <= 1"
                :aria-label="`Quitar una unidad de ${item.title}`"
                @click="
                  cartStore.updateQuantity(item.productId, item.quantity - 1)
                "
              >
                −
              </button>
              <span class="w-8 text-center font-bold" aria-live="polite">{{
                item.quantity
              }}</span>
              <button
                class="w-8 h-8 rounded-lg border border-stone-300 font-bold hover:bg-stone-100 disabled:opacity-40"
                :disabled="cartStore.isLoading || item.quantity >= item.stock"
                :aria-label="`Agregar una unidad de ${item.title}`"
                @click="
                  cartStore.updateQuantity(item.productId, item.quantity + 1)
                "
              >
                +
              </button>
              <button
                class="ml-4 text-sm text-red-600 hover:text-red-800 font-medium"
                :disabled="cartStore.isLoading"
                @click="cartStore.removeItem(item.productId)"
              >
                Quitar
              </button>
            </div>
          </div>
          <div class="font-extrabold text-stone-900 whitespace-nowrap">
            {{ formatPrice(item.subtotal) }}
          </div>
        </li>
      </ul>

      <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
        <div class="flex items-center justify-between text-lg">
          <span class="text-stone-600"
            >Total ({{ cartStore.cart.totalItems }} productos)</span
          >
          <span class="font-extrabold text-stone-900">{{
            formatPrice(cartStore.cart.total)
          }}</span>
        </div>
        <div class="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            class="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            :disabled="cartStore.isLoading"
            @click="cartStore.clear()"
          >
            Vaciar carrito
          </button>
          <!-- El pago/checkout es la siguiente etapa: no se simula una compra que no existe. -->
          <button
            type="button"
            class="sm:ml-auto rounded-xl bg-green-600 text-white px-5 py-2.5 font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="
              cartStore.isLoading || items.length === 0 || hasUnavailable
            "
            :title="
              hasUnavailable
                ? 'Hay productos sin stock suficiente'
                : 'Abrir WhatsApp con el pedido'
            "
            @click="checkoutWhatsApp"
          >
            Confirmar pedido por WhatsApp
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
