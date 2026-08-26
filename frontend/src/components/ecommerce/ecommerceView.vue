<script setup>
import { ref, onMounted, computed } from "vue";

// Estado
const products = ref([]);
const cart = ref([]);
const isLoading = ref(true);

// URL de API
const API_URL = "http://localhost:3000/products";

// Cargar productos
const fetchProducts = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error en la red");
    products.value = await response.json();
  } catch (error) {
    console.error("Error cargando los productos:", error);
    // Datos de respaldo
    products.value = [
      {
        _id: "1",
        title: "Alimento Perro Adulto",
        price: 25.0,
        description: "Bolsa de 15kg Nutrición Completa",
        imageUrl:
          "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400",
      },
      {
        _id: "2",
        title: "Juguete Hueso Goma",
        price: 8.5,
        description: "Ideal para la dentición",
        imageUrl:
          "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400",
      },
      {
        _id: "3",
        title: "Rascador para Gatos",
        price: 45.0,
        description: "Con multinivel y cueva",
        imageUrl:
          "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400",
      },
    ];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});

// Lógica del carrito
const addToCart = (product) => {
  const existing = cart.value.find((item) => item._id === product._id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.value.push({ ...product, quantity: 1 });
  }
};

const removeFromCart = (productId) => {
  cart.value = cart.value.filter((item) => item._id !== productId);
};

const cartTotal = computed(() => {
  return cart.value
    .reduce((total, item) => total + item.price * item.quantity, 0)
    .toFixed(2);
});
</script>

<template>
  <div class="allpets-container">
    <!-- Navbar / Header según diseño -->
    <header class="top-header">
      <div class="brand">
        <span class="logo-text">Allpets</span>
      </div>
      <div class="search-bar">
        <input type="text" placeholder="Buscar productos..." />
      </div>
      <div class="user-actions">
        <button class="btn-outline">Iniciar sesión</button>
        <div class="cart-badge">
          <span class="cart-icon">🛒</span>
          <span class="cart-amount">${{ cartTotal }}</span>
        </div>
      </div>
    </header>

    <!-- Barra de Navegación Naranja -->
    <nav class="category-nav">
      <a href="#">Mascotas</a>
      <a href="#">Marcas</a>
      <a href="#">Paseadores y cuidadores</a>
      <a href="#">Ayuda</a>
    </nav>

    <!-- Layout del E-commerce -->
    <div class="ecommerce-layout">
      <!-- Catálogo de Productos -->
      <main class="products-section">
        <h2 class="section-title">Productos Disponibles</h2>

        <div v-if="isLoading" class="loading">Cargando catálogo...</div>

        <div v-else class="grid">
          <div v-for="product in products" :key="product._id" class="card">
            <img
              :src="product.imageUrl || 'https://via.placeholder.com/150'"
              :alt="product.title"
              class="card-img"
            />
            <div class="card-body">
              <h3>{{ product.title }}</h3>
              <p class="desc">{{ product.description }}</p>
              <div class="card-footer">
                <span class="price">${{ product.price }}</span>
                <button @click="addToCart(product)" class="btn-add">
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Sidebar del Carrito -->
      <aside class="cart-section">
        <h2>Mi Carrito ({{ cart.length }})</h2>

        <div v-if="cart.length === 0" class="empty-cart">
          Tu carrito está vacío.
        </div>

        <ul v-else class="cart-list">
          <li v-for="item in cart" :key="item._id" class="cart-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>${{ item.price }} x {{ item.quantity }}</p>
            </div>
            <button @click="removeFromCart(item._id)" class="btn-remove">
              ✕
            </button>
          </li>
        </ul>

        <div v-if="cart.length > 0" class="cart-total">
          <h3>Total: ${{ cartTotal }}</h3>
          <button
            class="btn-checkout"
            @click="() => alert('¡Compra realizada con éxito!')"
          >
            Finalizar Compra
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* Variables de Color Basadas en la Imagen Allpets */
.allpets-container {
  --orange: #f26522;
  --teal: #5e9ca0;
  --dark-blue: #0f3459;
  --light-bg: #f4f6f8;
  --text-dark: #2c3e50;

  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  background-color: var(--light-bg);
  min-height: 100vh;
}

/* Header Superior */
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--dark-blue);
}

.search-bar input {
  width: 300px;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 20px;
  outline: none;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-outline {
  background: white;
  border: 2px solid var(--dark-blue);
  color: var(--dark-blue);
  padding: 0.4rem 1.2rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.cart-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--dark-blue);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: bold;
}

/* Navegación Naranja */
.category-nav {
  background-color: var(--orange);
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 2rem;
}

.category-nav a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.05rem;
}

.category-nav a:hover {
  text-decoration: underline;
}

/* Estructura Principal */
.ecommerce-layout {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.products-section {
  flex: 3;
}

.section-title {
  color: var(--teal);
  margin-bottom: 1.5rem;
  border-bottom: 3px solid var(--teal);
  display: inline-block;
  padding-bottom: 0.3rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

/* Tarjetas de Producto */
.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  border: 1px solid #eaeaea;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-3px);
}

.card-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-body h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--dark-blue);
}

.desc {
  color: #666;
  font-size: 0.85rem;
  flex-grow: 1;
  margin-bottom: 1rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--orange);
}

.btn-add {
  background: var(--orange);
  color: white;
  border: none;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-add:hover {
  background: #d85416;
}

/* Lateral del Carrito */
.cart-section {
  flex: 1;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  height: fit-content;
  border-top: 4px solid var(--teal);
}

.cart-section h2 {
  color: var(--teal);
  margin-top: 0;
}

.cart-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 0.6rem 0;
}

.btn-remove {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
}

.cart-total {
  border-top: 2px solid #eee;
  padding-top: 1rem;
}

.btn-checkout {
  background: var(--teal);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  width: 100%;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.btn-checkout:hover {
  background: #4d8387;
}
</style>
