<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import walkersHeroImg from '../assets/walkers-hero.webp'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const city = ref('Cipolletti')
const phone = ref('')
const role = ref('walker')
const errorMsg = ref('')
const isLoading = ref(false)

const roles = [
  { value: 'walker', title: 'Paseador', hint: 'Paseos diarios' },
  { value: 'caregiver', title: 'Cuidador', hint: 'Alojamiento y guardería' },
]

const steps = [
  {
    title: 'Crea tu perfil sin cargo',
    text: 'Registrarte es gratis. Ofrece alojamiento, guardería, cuidado a domicilio o paseos.',
  },
  {
    title: 'Decide cómo quieres trabajar',
    text: 'Elige tu horario, tus tarifas por hora y los tamaños de mascota que aceptas.',
  },
  {
    title: 'Recibe a tu primera mascota',
    text: 'Con tu perfil activo, los dueños te contactan directo para coordinar cada servicio.',
  },
]

const benefits = [
  { title: 'Tu horario y tu tarifa', text: 'Define tus días disponibles, tus servicios y tu presupuesto.' },
  { title: 'Clientes cercanos', text: 'Tu perfil se muestra a dueños de Cipolletti y Neuquén.' },
  { title: 'Fotos y certificaciones', text: 'Sube tu galería y tus permisos o cursos desde el teléfono.' },
  { title: 'Contacto directo', text: 'Coordina cada paseo por WhatsApp, cuando quieras.' },
]

const handleRegisterWorker = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    await authStore.register(name.value, email.value, password.value, city.value, phone.value, role.value)
    await authStore.login(email.value, password.value)
    router.push('/onboarding-trabajador')
  } catch (error: any) {
    errorMsg.value = error.message || 'No pudimos crear tu cuenta. Revisa los datos e intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="wp-root min-h-screen px-5 py-12 sm:px-8 sm:py-16">
    <div class="mx-auto max-w-6xl">

      <!-- Hero + formulario -->
      <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">

        <!-- Izquierda -->
        <div>
          <p class="wp-muted text-sm">Cipolletti y Neuquén</p>
          <h1 class="wp-serif mt-3 max-w-xl text-4xl font-semibold leading-[1.1] sm:text-5xl">
            Cuida y pasea mascotas con All Pets
          </h1>
          <p class="wp-muted mt-4 max-w-md text-base leading-relaxed">
            Gana dinero con tu propio horario mientras pasas tiempo con animales.
          </p>

          <div class="mt-10 aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100">
            <img
              :src="walkersHeroImg"
              alt="Paseadores y cuidadores con perros en All Pets"
              class="h-full w-full object-cover object-center"
            />
          </div>

          <ol class="mt-12 space-y-7">
            <li v-for="(step, i) in steps" :key="step.title" class="flex gap-4">
              <span class="wp-step">{{ i + 1 }}</span>
              <div>
                <h3 class="text-sm font-semibold">{{ step.title }}</h3>
                <p class="wp-muted mt-1 max-w-sm text-sm leading-relaxed">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>

        <!-- Derecha: formulario -->
        <div class="wp-card p-7 sm:p-9 lg:sticky lg:top-24">
          <h2 class="wp-serif text-2xl font-semibold">Crea tu perfil</h2>
          <p class="wp-muted mt-1 text-sm">Es gratis y te toma un minuto.</p>

          <form class="mt-7 space-y-5" @submit.prevent="handleRegisterWorker">
            <fieldset>
              <legend class="wp-field-label mb-2">¿Qué servicio ofreces?</legend>
              <div class="grid grid-cols-2 gap-3">
                <label
                  v-for="r in roles"
                  :key="r.value"
                  class="wp-option"
                  :class="{ 'wp-option--active': role === r.value }"
                >
                  <input type="radio" name="service-type" :value="r.value" v-model="role" class="sr-only" />
                  <span class="block text-sm font-semibold">{{ r.title }}</span>
                  <span class="wp-muted mt-0.5 block text-xs">{{ r.hint }}</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label for="name" class="wp-field-label">Nombre completo</label>
              <input id="name" type="text" required autocomplete="name" v-model="name" class="wp-input" placeholder="María Gómez" />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="city" class="wp-field-label">Ciudad</label>
                <select id="city" v-model="city" required class="wp-input">
                  <option value="Cipolletti">Cipolletti</option>
                  <option value="Neuquén">Neuquén</option>
                </select>
              </div>
              <div>
                <label for="phone" class="wp-field-label">WhatsApp</label>
                <input id="phone" type="tel" required autocomplete="tel" v-model="phone" class="wp-input" placeholder="299 123-4567" />
              </div>
            </div>

            <div>
              <label for="email-address" class="wp-field-label">Correo electrónico</label>
              <input id="email-address" type="email" autocomplete="email" required v-model="email" class="wp-input" placeholder="tu@correo.com" />
            </div>

            <div>
              <label for="password" class="wp-field-label">Contraseña</label>
              <input id="password" type="password" required minlength="6" autocomplete="new-password" v-model="password" class="wp-input" placeholder="Mínimo 6 caracteres" />
            </div>

            <p v-if="errorMsg" role="alert" class="wp-error">{{ errorMsg }}</p>

            <button type="submit" :disabled="isLoading" class="wp-btn-primary w-full">
              {{ isLoading ? 'Creando cuenta...' : 'Crear cuenta' }}
            </button>
          </form>

          <p class="wp-muted mt-6 text-center text-sm">
            ¿Buscas una cuenta de cliente?
            <RouterLink to="/register" class="wp-link">Ir al registro</RouterLink>
          </p>
        </div>
      </div>

      <!-- Ventajas -->
      <div class="mt-20 border-t border-[var(--color-line)] pt-12 sm:mt-24">
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="b in benefits" :key="b.title">
            <h3 class="wp-serif text-lg font-semibold">{{ b.title }}</h3>
            <p class="wp-muted mt-1.5 text-sm leading-relaxed">{{ b.text }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Public+Sans:wght@400;500;600&display=swap');

:root {
  --color-ink: #1E2B22;
  --color-paper: #FFFFFF;
  --color-forest: #3F5B46;
  --color-clay: #B15A34;
  --color-gold: #C99A46;
  --color-line: #D8CFB8;
}

.wp-root {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: 'Public Sans', ui-sans-serif, system-ui, sans-serif;
}

.wp-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }

.wp-muted { color: rgba(30, 43, 34, 0.68); }

/* Tarjeta del formulario: un solo borde suave, sin sombras */
.wp-card {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 1.25rem;
}

/* Número de paso: es una secuencia real, por eso lleva número */
.wp-step {
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--color-forest);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
}

.wp-field-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(30, 43, 34, 0.85);
}

.wp-input {
  width: 100%;
  color: var(--color-ink);
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: 0.6rem;
  padding: 0.65rem 0.8rem;
  font-size: 0.9rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.wp-input::placeholder { color: rgba(30, 43, 34, 0.45); }
.wp-input:focus {
  outline: none;
  border-color: var(--color-forest);
  box-shadow: 0 0 0 3px rgba(63, 91, 70, 0.15);
}

/* Selector de servicio */
.wp-option {
  cursor: pointer;
  border: 1px solid var(--color-line);
  border-radius: 0.75rem;
  padding: 0.8rem 0.9rem;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.wp-option:hover { background: rgba(63, 91, 70, 0.04); }
.wp-option--active {
  border-color: var(--color-forest);
  background: rgba(63, 91, 70, 0.06);
  box-shadow: inset 0 0 0 1px var(--color-forest);
}
.wp-option:focus-within {
  outline: 2px solid var(--color-forest);
  outline-offset: 2px;
}

.wp-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.4rem;
  border-radius: 0.75rem;
  background: var(--color-forest);
  color: #F6F2E9;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.15s ease;
}
.wp-btn-primary:hover:not(:disabled) { background: #33473A; }
.wp-btn-primary:focus-visible {
  outline: 2px solid var(--color-forest);
  outline-offset: 2px;
}
.wp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.wp-link {
  margin-left: 0.25rem;
  font-weight: 600;
  color: var(--color-forest);
}
.wp-link:hover { text-decoration: underline; }

.wp-error {
  border: 1px solid rgba(177, 90, 52, 0.35);
  background: rgba(177, 90, 52, 0.06);
  color: var(--color-clay);
  border-radius: 0.6rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
}
</style>