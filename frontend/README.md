# All Pets — Frontend

Interfaz web de **All Pets** hecha con **Vue 3** (Composition API + TypeScript), **Pinia**,
**Vue Router**, **Axios** y **Tailwind CSS 4**, sobre **Vite**.

> ⚓ El frontend habla **solo con el API Gateway**, nunca con los microservicios.
> Endpoints, roles y estado de cada requerimiento: [docs/ANCLA.md](../docs/ANCLA.md).

## Puesta en marcha

Requisitos: Node.js 22.18+ (o 24.12+) y el backend corriendo (ver [backend/README.md](../backend/README.md)).

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev            # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Chequeo de tipos (`vue-tsc`) y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run type-check` | Solo chequeo de tipos |
| `npm run lint` | ESLint |
| `npm test` | Tests con Vitest |

### Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `VITE_WHATSAPP_NUMBER` | número de la tienda | WhatsApp que recibe los pedidos del carrito: solo dígitos, con código de país |
| `VITE_API_URL` | `http://localhost:3000` | URL del API Gateway. Se lee en `src/config.ts`; no escribas la URL a mano en otros archivos. |

## Estructura

```
frontend/
├── index.html            # Punto de entrada (aplica el tema oscuro guardado antes de pintar)
├── main.css              # Tailwind + variables de tema claro/oscuro
└── src/
    ├── main.ts           # Crea la app, Pinia, router y restaura el token JWT
    ├── App.vue           # Layout: navbar, cambio de tema, carrito, footer
    ├── config.ts         # API_URL y helper para rutas de /uploads
    ├── router/           # Rutas y protección por rol
    ├── stores/           # Estado global (Pinia)
    │   ├── auth.ts             # login, registro, sesión
    │   ├── profile.ts          # perfil profesional, imágenes, reseñas, datos del cliente
    │   ├── paseadores.ts       # directorio público y filtros
    │   ├── products.ts         # catálogo y CRUD de admin
    │   ├── cart.ts             # carrito del usuario
    │   └── adminCaregivers.ts  # aprobación y edición de prestadores
    ├── components/paseadores/  # Tarjeta y filtros del directorio
    ├── components/layout/      # AppHeader (buscador, menú multinivel) y AppFooter
    ├── components/shop/        # ProductCard reutilizable
    ├── components/admin/       # Vista previa del perfil para aprobar prestadores
    ├── data/catalog.ts   # Categorías del menú, la home y los filtros de la tienda
    ├── utils/            # formatARS (pesos) y link de WhatsApp
    ├── types/            # Tipos de dominio (paseador, tienda)
    ├── views/            # Pantallas (ver tabla de rutas)
    └── assets/           # Imágenes y logo
```

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | `HomeView` — banners, categorías, paseadores y cuidadores, productos destacados | Público |
| `/paseadores` | `PaseadoresView` — secciones `#servicios` (filtros y listado) y `#quienes-somos`; acepta `?rol=`, `?q=`, `?perfil=` | Público |
| `/login` | `LoginView` | Sin sesión |
| `/register` | `RegisterView` — alta de cliente | Sin sesión |
| `/trabaja-con-nosotros` | `RegisterWorkerView` — alta de paseador/cuidador | Público |
| `/onboarding-trabajador` | `WorkerOnboardingView` — primeros datos del perfil | `walker` / `caregiver` |
| `/mi-panel` | `WorkerDashboardView` — disponibilidad, estado de aprobación, perfil, galería, certificaciones | `walker` / `caregiver` |
| `/mi-perfil` | `ClientProfileView` — datos personales y foto | Con sesión |
| `/tienda` | `ShopView` — catálogo con búsqueda | Público |
| `/carrito` | `CartView` — carrito y pedido por WhatsApp | Con sesión |
| `/admin` | `AdminView` — pestañas *Paseadores* (vista previa del perfil antes de aprobar) y *Productos* (con subida de fotos) | `admin` |

**Áreas por rol** (`src/router/index.ts`):

- **Paseadores y cuidadores** solo usan `/mi-panel` (con la pestaña *Vista previa*, que muestra su
  tarjeta y su perfil tal como los ven los clientes; se abre directo con `/mi-panel?tab=vista-previa`)
  y `/onboarding-trabajador`. Cualquier otra ruta los devuelve a su panel.
- **Administrador**: solo `/admin`.
- **Clientes y visitantes**: el sitio público; `/mi-perfil` y `/carrito` piden sesión.

El header se adapta: a prestadores y admin no les muestra la tienda, el buscador ni el carrito.
La protección de rutas del router es solo de experiencia de usuario: el backend vuelve a
validar el JWT y el rol en cada petición.

## Convenciones

- Toda llamada HTTP usa `API_URL` de `src/config.ts`; las rutas `/uploads/...` se convierten con `toApiUrl`.
- Todos los precios y tarifas se muestran con `formatARS` de `src/utils/currency.ts` (pesos argentinos: `$ 4.000`, `$ 2.550,50`).
- El token JWT se guarda en `localStorage` y se envía con `axios.defaults.headers.common.Authorization`.
- Los errores del backend llegan con su código real (401, 403, 404, 409…); cada store los traduce
  a un mensaje para el usuario leyendo `response.data.message`.
- Tema claro/oscuro con la clase `dark` en `<html>` y la variante `dark:` de Tailwind.
- Colores de marca en `main.css` (`--brand: #634A39` cacao, `--brand-dark`, `--header-accent`...), con su
  versión para modo oscuro. En Tailwind 4 se usan con paréntesis: `bg-(--brand)`. La forma de v3
  `bg-[--brand]` **no funciona** (genera CSS inválido). No usar colores sueltos como `indigo-*`.
- Textos en español rioplatense con voseo ("Mirá", "Elegí", "Subí") y mayúscula solo en la primera palabra
  de títulos y botones ("Editar perfil", no "Editar Perfil").

## Entorno recomendado

[VS Code](https://code.visualstudio.com/) + extensión [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
y las [Vue.js devtools](https://devtools.vuejs.org/) en el navegador.
