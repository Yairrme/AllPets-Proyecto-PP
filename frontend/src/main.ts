/**
 * ============================================================================
 * ARCHIVO: main.ts
 * ROL EN LA ARQUITECTURA: Punto de entrada principal (Entry Point) del Frontend Vue 3.
 * ============================================================================
 * Descripción general:
 * Este archivo inicializa la aplicación Vue, configura el gestor de estado global
 * (Pinia), el sistema de enrutamiento (Vue Router), restaura el token JWT en los
 * encabezados por defecto de Axios para autenticar peticiones hacia el API Gateway
 * (puerto 3000) y finalmente monta la aplicación en el contenedor DOM `#app`.
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

// Creamos la instancia raíz de la aplicación Vue a partir del componente principal App.vue
const app = createApp(App)

// Recuperamos el token JWT almacenado en el navegador (si el usuario ya había iniciado sesión antes).
// Si existe, lo adjuntamos automáticamente en la cabecera `Authorization: Bearer <token>`
// de todas las futuras peticiones HTTP que realice Axios hacia el API Gateway.
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`
}

// Registramos Pinia para el manejo de stores reactivos globales (auth, paseadores, profile)
app.use(createPinia())

// Registramos Vue Router para la navegación SPA (Single Page Application) y protección de rutas
app.use(router)

// Montamos la aplicación en el elemento <div id="app"> definido en index.html
app.mount('#app')
