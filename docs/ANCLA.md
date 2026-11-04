# ⚓ Ancla de documentación — All Pets

Este archivo es el **contrato** entre la documentación oficial del proyecto
(*All Pets Documentación*, PDF de Práctica Profesionalizante III, ITS Cipolletti 2026)
y el código del repositorio.

- Si el código y la documentación no coinciden, **manda este archivo**: o se corrige
  el código para cumplirlo, o se registra la diferencia en
  [Desvíos aceptados](#5-desvíos-aceptados-respecto-del-pdf) con su motivo.
- Todo cambio que toque arquitectura, endpoints, esquemas de datos o roles
  **debe actualizar este archivo en el mismo commit** (ver [Reglas](#8-reglas-para-mantener-el-ancla)).

Última revisión contra el código: **03/11/2026** (rama `develop-1.2`).

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Roles y usuarios](#2-roles-y-usuarios)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Endpoints del API Gateway](#4-endpoints-del-api-gateway)
5. [Desvíos aceptados respecto del PDF](#5-desvíos-aceptados-respecto-del-pdf)
6. [Requerimientos: estado de cumplimiento](#6-requerimientos-estado-de-cumplimiento)
7. [Pendientes conocidos](#7-pendientes-conocidos)
8. [Reglas para mantener el ancla](#8-reglas-para-mantener-el-ancla)

Leyenda de estado: ✅ cumple · 🟡 parcial · ❌ no implementado · ⏸ postergado por decisión del equipo.

---

## 1. Arquitectura

Fuente en el PDF: *Arquitectura del sistema*, *Componentes del sistema*, *Estructura de carpetas*.

```
Frontend (Vue 3 + Pinia + Tailwind)
        │  HTTP REST + JWT
        ▼
API Gateway (NestJS, HTTP :3000)  ── único punto de entrada
   │  TCP :3001                 │  TCP :3002
   ▼                            ▼
Core User Service          Market Service
(auth, perfiles, reseñas)  (productos, carrito)
   │                            │
   ▼                            ▼
MongoDB · allpets_users     MongoDB · allpets
```

| Regla de la documentación | Dónde se cumple | Estado |
|---|---|---|
| El frontend **nunca** llama a los microservicios; todo pasa por el API Gateway | `frontend/src/config.ts` → `API_URL` apunta al gateway | ✅ |
| El gateway valida el JWT antes de enrutar | `apps/api-gateway/src/auth/jwt-auth.guard.ts`; además comprueba que la cuenta exista y usa su rol actual (`user-session.service.ts`, caché de 60 s por instancia) | ✅ |
| El gateway aplica *rate limiting* por IP | `ThrottlerGuard` global en `apps/api-gateway/src/app.module.ts` (120 req/min; login 5/min, registro 5/15 min, subidas 10/min). Con `REDIS_URL` el conteo se comparte entre instancias; detrás de un proxy se configura `TRUST_PROXY_HOPS` | ✅ |
| Gateway ↔ microservicios por TCP interno de NestJS | `ClientsModule` en el gateway, `createMicroservice` en cada servicio; escuchan en `127.0.0.1` salvo `USER_SERVICE_BIND_HOST` / `MARKET_SERVICE_BIND_HOST` (el TCP no tiene autenticación: nunca exponerlo fuera de una red privada) | ✅ |
| Cada microservicio tiene su propia base de datos y ninguno lee la del otro | `MONGO_URI_USERS` / `MONGO_URI_MARKET`; relaciones entre bases por *soft reference* (IDs) | ✅ |
| Contratos compartidos en `libs/contracts` (DTOs, enums, patrones TCP) | `backend/libs/contracts/src` | ✅ |
| Errores de los microservicios llegan al frontend con su código HTTP real | `HttpToRpcExceptionFilter` + `rpcErrorToHttpException` en `backend/libs/common/src/rpc/` | ✅ |
| Booking & Location Service (reservas, GPS, Redis, WebSockets) | No existe la carpeta `apps/booking-location-service` | ⏸ postergado (así lo indica el PDF) |

## 2. Roles y usuarios

Fuente: *Usuarios del sistema*, *Base de datos del microservicio core-user-service*.

Roles válidos (enum `UserRole` en `libs/contracts/src/enums/user-role.enum.ts`), **siempre en minúscula**:

| Rol | Quién es | Cómo se crea |
|---|---|---|
| `client` | Dueño de mascota | `POST /auth/register` |
| `walker` | Paseador | `POST /auth/register` (perfil profesional nace en estado `pending`) |
| `caregiver` | Cuidador | `POST /auth/register` (perfil profesional nace en estado `pending`) |
| `admin` | Administrador | **Nunca** por registro público; se asigna directo en la base de datos |

Los perfiles de paseador/cuidador solo son públicos cuando un admin los aprueba
(`ProfileStatus`: `pending` · `approved` · `rejected`).

## 3. Modelo de datos

Fuente: *Modelo de datos* (diagrama), *Esquema de Base de Datos: Core User Service*,
*Esquema de Base de Datos: Market Service*. Todas las colecciones usan los timestamps
`created_at` y `updated_at`.

### 3.1 Users DB (`core-user-service`)

**`users`** — `apps/core-user-service/src/schemas/user.schema.ts`

| Campo | Tipo | Restricciones |
|---|---|---|
| `name` | String | requerido |
| `email` | String | requerido, único, indexado, se guarda en minúscula |
| `password_hash` | String | requerido, bcrypt (10 rondas), nunca sale en respuestas |
| `role` | String (enum) | `client` (default) · `walker` · `caregiver` · `admin` |
| `city` | String (enum) | `Cipolletti` (default) · `Neuquén` |
| `phone` | String | opcional para `client`, obligatorio para prestadores; **cifrado AES-256-GCM** en reposo; no viaja en el directorio público (ver `GET /caregivers/:userId/contact`) |
| `profile_image` | String | ruta `/uploads/...` |

**`caregiverprofiles`** — `schemas/caregiver-profile.schema.ts`

| Campo | Tipo | Restricciones |
|---|---|---|
| `user_id` | ObjectId → User | requerido, único |
| `bio` | String | default `""` |
| `services` | String[] | default `[]` |
| `availability` | String[] | default `[]` |
| `rating_avg` | Number | default `0`, se recalcula al crear, editar o eliminar una reseña y al eliminar a quien la escribió |
| `total_reviews` | Number | default `0` |
| `hourly_rate`, `experience_years`, `accepted_sizes`, `certifications`, `profile_image` | — | extensiones (ver [desvíos](#5-desvíos-aceptados-respecto-del-pdf)) |
| `gallery_images` | String[] | rutas `/uploads/...`, máximo 20; se agregan y quitan solo con sus endpoints |
| `certification_documents` | String[] | **nombres de archivo** en `private-uploads/certifications/<userId>/`, máximo 20; solo los ven el dueño y el admin |
| `status` | String (enum) | `pending` · `approved` · `rejected` — lo define el admin |
| `is_available` | Boolean | default `true` — lo define el propio prestador; el cliente lo ve como "Disponible" / "No disponible" |

**`reviews`** — `schemas/review.schema.ts`

| Campo | Tipo | Restricciones |
|---|---|---|
| `reviewer_id` | ObjectId → User | requerido; sale del JWT, no del body |
| `caregiver_id` | ObjectId → User | requerido; debe ser `walker` o `caregiver` |
| `score` | Number (entero) | requerido, 1 a 5 |
| `comment` | String | default `""` |
| — | índice único | (`reviewer_id`, `caregiver_id`): una reseña por cliente y prestador |

### 3.2 Market DB (`market-service`)

**`products`** — `apps/market-service/src/products/product.schema.ts`

| Campo | Tipo | Restricciones |
|---|---|---|
| `title` | String | requerido, trim |
| `description` | String | requerido |
| `price` | Number | requerido, mínimo 0 |
| `petType` | String | requerido, minúscula (ej. `perro`, `gato`) |
| `category` | String | requerido, minúscula (ej. `alimentos`, `accesorios`) |
| `imageUrl` | String | requerido |
| `stock` | Number (entero) | requerido, mínimo 0 (presente en el diagrama ER) |

**`carts`** — `apps/market-service/src/cart/cart.schema.ts`

| Campo | Tipo | Restricciones |
|---|---|---|
| `user_id` | String | requerido, único; *soft reference* al User de la Users DB |
| `items[].product_id` | ObjectId → Product | requerido |
| `items[].quantity` | Number | requerido, 1 a 99 |
| `__v` | Number | concurrencia optimista: dos cambios simultáneos no se pisan (`CART_BUSY` / 409 si se agotan los reintentos) |

**`orders`, `order_items`, `payments`** (diagrama ER) — ❌ no implementados todavía.

## 4. Endpoints del API Gateway

Fuente: *Documentación de Endpoints Habilitados* (core user service y market service).
Documentación interactiva: `http://localhost:3000/api/docs` (Swagger / OpenAPI 3).

**Acceso**: 🌐 público · 🔑 cualquier usuario con JWT · 👤 dueño del recurso o admin · 🛡 solo admin · rol indicado.

### Autenticación
| Método | Ruta | Acceso | Body |
|---|---|---|---|
| POST | `/auth/register` | 🌐 (5 cada 15 min) | `name`, `email`, `password` (6–72), `city`, `role`, `phone` (obligatorio si no es `client`) |
| POST | `/auth/login` | 🌐 (5 por min) | `email`, `password` → `{ access_token, user }` |

### Usuarios
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/users?page&limit` | 🛡 (paginado) |
| GET | `/users/:id` | 👤 |
| PUT | `/users/:id` | 👤 — `name`, `email`, `city`, `phone` |
| DELETE | `/users/:id` | 🛡 — borra también perfil, reseñas, carrito y archivos; recalcula a los prestadores reseñados y el token deja de valer |
| POST | `/users/:userId/image` | 👤 — multipart `file` (JPG/PNG/WEBP, 5 MB) |

### Perfil profesional (paseador / cuidador)
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/users/:userId/caregiver-profile` | 👤 — perfil completo, con comprobantes y en cualquier estado |
| PUT | `/users/:userId/caregiver-profile` | 👤 + rol `walker`/`caregiver`/`admin` — actualización parcial; no acepta fotos ni comprobantes |
| POST | `/users/:userId/caregiver-profile/image` | 👤 — multipart `file` |
| POST | `/users/:userId/caregiver-profile/gallery` | 👤 — multipart `files` (hasta 10 por vez, 20 en total; 409 si se supera) |
| DELETE | `/users/:userId/caregiver-profile/gallery/:filename` | 👤 — quita la foto y borra el archivo |
| POST | `/users/:userId/caregiver-profile/certifications` | 👤 — multipart `files` (hasta 10 por vez, 20 en total; 409 si se supera) |
| GET | `/users/:userId/caregiver-profile/certifications/:filename` | 👤 — imagen del comprobante |
| DELETE | `/users/:userId/caregiver-profile/certifications/:filename` | 👤 — quita el comprobante y borra el archivo |

### Directorio público de prestadores
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/caregivers?page&limit&q&city&role&max_rate&min_rating&pet_size&available` | 🌐 — solo perfiles aprobados, sin email, teléfono ni comprobantes; cada uno incluye su `profile` (una sola petición). Los filtros se resuelven en la base |
| GET | `/caregivers/:userId` | 🌐 — un prestador del directorio, con la misma forma |
| GET | `/caregivers/:userId/profile` | 🌐 — solo aprobados (404 si no), sin comprobantes |
| GET | `/caregivers/:userId/contact` | rol `client`/`admin` (30 por min) — `{ phone }`; 409 si no toma clientes nuevos |
| GET | `/caregivers/:caregiverId/reviews?page&limit` | 🌐 |

### Reseñas
| Método | Ruta | Acceso | Body |
|---|---|---|---|
| POST | `/reviews` | rol `client` | `caregiver_id`, `score` (entero 1–5), `comment` (hasta 500 caracteres) |
| PATCH | `/reviews/:reviewId` | rol `client`, solo el autor (404 si no es suya) | `score`, `comment` |
| DELETE | `/reviews/:reviewId` | rol `client`, solo el autor (404 si no es suya) | — |
| GET | `/reviews/caregiver/:caregiverId/mine` | rol `client` | — → `{ review }` o `{ review: null }` |
| GET | `/reviews/caregiver/:caregiverId` | 🔑 | — |

### Administración de prestadores
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/admin/caregivers?status&page&limit` | 🛡 — cada fila trae `profile_status`, `is_available` y `caregiver_image` |
| GET | `/admin/caregivers/:userId` | 🛡 |
| PATCH | `/admin/caregivers/:userId/status` | 🛡 — `{ status: pending\|approved\|rejected }` |

### Tienda
| Método | Ruta | Acceso | Body |
|---|---|---|---|
| GET | `/products?page&limit&q&petType&category&sort` | 🌐 | `sort`: `relevancia` · `precio-asc` · `precio-desc` → `{ data, pagination, facets: { petTypes, categories } }` |
| GET | `/products/:id` | 🌐 | — |
| POST | `/products` | 🛡 | `title`, `description`, `price`, `petType`, `category`, `imageUrl` (URL http(s) o ruta `/uploads/...`), `stock` |
| POST | `/products/image` | 🛡 (10 por min) | multipart `file` (JPG/PNG/WEBP, 5 MB) → `{ imageUrl: "/uploads/..." }` |
| PATCH | `/products/:id` | 🛡 | cualquiera de los campos anteriores |
| DELETE | `/products/:id` | 🛡 | — |
| GET | `/cart` | 🔑 | — |
| POST | `/cart/items` | 🔑 | `productId`, `quantity` (1–99) |
| PATCH | `/cart/items/:productId` | 🔑 | `quantity` |
| DELETE | `/cart/items/:productId` | 🔑 | — |
| DELETE | `/cart` | 🔑 | — |

### Salud
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/health` | 🌐 — estado del gateway, core-user-service y market-service (503 si alguno no responde o perdió su base de datos) |

## 5. Desvíos aceptados respecto del PDF

Diferencias conocidas. Cada una está decidida; si alguna deja de valer, se corrige el código.

| # | El PDF dice | El código hace | Motivo |
|---|---|---|---|
| D1 | Ejemplo JSON de `users` con `firstName`, `lastName`, `isActive`, `role: "OWNER"` y `walkerProfile` embebido (págs. 7–8) | `name` único, roles en minúscula (`client`…), perfil profesional en la colección `caregiverprofiles` | La sección *Esquema de Base de Datos: Core User Service* (págs. 24–25) es la definitiva; el ejemplo JSON es anterior. **Actualizar el PDF.** |
| D2 | `POST /auth/register` recibe `name`, `email`, `password`, `role` | También exige `city` y, para prestadores, `phone` | La búsqueda por zona (RF08) y el contacto (Ver número de contacto) los necesitan. **Actualizar el PDF.** |
| D3 | `GET /users` devuelve todos los usuarios | Solo admin, paginado | Evita exponer emails y teléfonos de todos. |
| D4 | `POST /reviews` recibe `reviewer_id` en el body | `reviewer_id` sale del JWT; solo un `client` puede reseñar | Evita reseñas a nombre de otro usuario. |
| D5 | Market Service accesible "por TCP o consumo directo HTTP en puerto 3000" | Solo TCP en el puerto 3002, siempre detrás del gateway | Es lo que define la arquitectura (frontend → gateway). |
| D6 | `CART_ITEM` como colección aparte con `cart_id` y `unit_price` | Ítems embebidos en el documento `carts`; el precio se lee del producto en cada consulta | Patrón idiomático de MongoDB; el precio congelado (`unit_price`) corresponde a `ORDER_ITEM`, cuando existan órdenes. |
| D7 | Perfil profesional con `bio`, `services`, `availability`, `rating_avg` | Además `hourly_rate`, `experience_years`, `accepted_sizes`, `certifications`, `certification_documents`, `profile_image`, `gallery_images`, `total_reviews`, `status` | Necesarios para el diseño de Figma (tarifa, verificaciones, galería) y la aprobación por admin. |
| D8 | Una instancia de MongoDB dedicada por servicio | Un solo contenedor `mongo` con bases separadas (`allpets_users`, `allpets`) | Suficiente para desarrollo; el aislamiento lógico se mantiene. |
| D9 | Diagrama: Market Service llama a Core User y a Booking | Cada servicio se comunica solo con el gateway | El market no necesita datos de usuario más allá del `userId` del JWT. Al eliminar una cuenta, el gateway le pide borrar el carrito. |
| D10 | "Ver número de contacto" en el perfil público | El teléfono solo se entrega con sesión de cliente, de a uno, por `GET /caregivers/:userId/contact` | Decisión del equipo: evita copiar en masa los teléfonos de los prestadores. |
| D11 | — | Los comprobantes de certificación solo los ven el dueño y el admin; el público ve la insignia | Decisión del equipo: pueden contener datos personales. |
| D12 | `GET /products` devuelve la lista de productos | Devuelve una página con `data`, `pagination` y `facets` | Un catálogo grande no puede enviarse ni filtrarse entero en el navegador. **Actualizar el PDF.** |

## 6. Requerimientos: estado de cumplimiento

### Funcionales

| # | Requerimiento | Estado | Dónde / qué falta |
|---|---|---|---|
| RF01 | Registro de usuarios | ✅ | `POST /auth/register`, `RegisterView.vue` |
| RF02 | Inicio de sesión | ✅ | `POST /auth/login` (JWT + bcrypt), `LoginView.vue` |
| RF03 | Registro de paseadores y cuidadores | ✅ | `RegisterWorkerView.vue`, `WorkerOnboardingView.vue`; el admin revisa el perfil completo (fotos, comprobantes, checklist) antes de aprobar en `/admin`; el prestador activa o pausa su disponibilidad desde `/mi-panel` |
| RF04 | Catálogo de productos | ✅ | `GET /products` paginado, `ShopView.vue` (precio y stock) |
| RF05 | Búsqueda y filtrado por categoría | ✅ | Buscador central del header y filtros por mascota y categoría en `/tienda` (`?q=`, `?mascota=`, `?categoria=`), con orden por precio, resueltos en la API; menú multinivel en `src/data/catalog.ts` |
| RF06 | Carrito de compras | ✅ | `/cart`, persistido en la colección `carts` |
| RF07 | Métodos de pago (tarjeta, Mercado Pago) | ❌ | Hoy el pedido se envía por WhatsApp (`CartView.vue`); faltan órdenes, preferencias y webhooks de Mercado Pago |
| RF08 | Buscar prestadores por ubicación o zona | 🟡 | Filtro por ciudad (Cipolletti / Neuquén) en la API; la búsqueda geoespacial depende del Booking Service ⏸ |
| RF09 | Consultar perfil del prestador | ✅ | `GET /caregivers/:userId/profile`, modal de perfil en `PaseadoresView.vue` |
| RF10 | Estado del servicio | ❌ | Depende de reservas (Booking Service ⏸) |
| RF11 | Valoraciones y reseñas | 🟡 | Reseñas a prestadores ✅ (su autor puede editarlas y eliminarlas); reseñas de productos ❌ |
| RF12 | Notificaciones | ❌ | Nodemailer no está instalado |

> Nota sobre el PDF: las descripciones de RF09 ("Geolocalización en tiempo real") y RF10
> están corridas respecto de su título, y RF10 repite el texto de RF12. Conviene corregirlas.

### No funcionales y técnicos

| Atributo | Estado | Detalle |
|---|---|---|
| Seguridad: JWT + bcrypt | ✅ | Además cifrado AES-256-GCM de teléfonos y guards por rol y por dueño |
| Rate limiting en el gateway | ✅ | `ThrottlerGuard` global; compartido entre instancias con Redis. Si Redis falla, deja pasar y lo registra |
| Cabeceras de seguridad y CORS | ✅ | `helmet`; CORS limitado a `CORS_ORIGINS` (obligatorio en producción) |
| Observabilidad | 🟡 | Logs JSON en producción y `x-request-id` por petición en el gateway; el ID todavía no viaja a los microservicios; faltan métricas |
| Contenedores e integración continua | ✅ | `Dockerfile` por proyecto, `docker compose --profile app`, `.github/workflows/ci.yml` |
| HTTPS | ❌ | Corresponde al despliegue (proxy inverso); en desarrollo es HTTP |
| Swagger / OpenAPI 3 | ✅ | `/api/docs`; en producción deshabilitado o protegido con usuario y contraseña |
| Multer en `/uploads` | ✅ | Solo JPG/PNG/WEBP, 5 MB, nombre aleatorio. Los comprobantes van a `private-uploads/`, que no se sirve como estático |
| Validación del entorno | ✅ | Esquemas de **Joi** por servicio (`libs/common/src/config/env.validation.ts`), conectados con `validationSchema` de `ConfigModule`. Si falta o es inválida una variable, el servicio no arranca |
| Validación de peticiones | ✅ | `ValidationPipe` con DTOs de `class-validator` en `libs/contracts` |
| MongoDB + Mongoose | ✅ | |
| Nodemailer | ❌ | Ver RF12 |
| Responsive con Tailwind | ✅ | Tailwind CSS 4 |
| Redis + WebSockets | 🟡 | Redis se usa para el rate limiting; WebSockets y GPS dependen del Booking Service ⏸ |

## 7. Pendientes conocidos

Ordenados por impacto. Al resolver uno, moverlo a la tabla correspondiente.

1. **Rotar secretos**: el `JWT_SECRET` y la `PHONE_ENCRYPTION_KEY` que estaban de ejemplo en
   `backend/README.md` quedaron publicados en el historial de git. En cada entorno, con los servicios
   detenidos: `npm run secrets:rotate -- --apply` (genera valores nuevos y vuelve a cifrar los teléfonos).
2. **Migrar comprobantes**: los subidos antes del 03/11/2026 siguen en la carpeta pública `uploads/`.
   En cada entorno: `npm run migrate:cert-docs -- --apply`.
3. Órdenes y pagos con Mercado Pago (RF07): colecciones `orders`, `order_items`, `payments`.
4. Notificaciones por email con Nodemailer (RF12).
5. Reseñas de productos (RF11).
6. **Archivos en disco local**: `uploads/` y `private-uploads/` impiden tener más de una instancia del gateway
   (salvo un volumen compartido). Elegir un almacenamiento externo (S3, R2, Cloudinary).
7. **Transporte TCP**: apunta a un solo host y puerto. Pasar a un broker (NATS o RabbitMQ) antes de sumar el Booking Service.
8. **Consistencia entre servicios**: al eliminar una cuenta, el gateway borra el carrito con una llamada directa;
   si el market está caído queda registrado en el log y el carrito queda huérfano. Con el broker, pasarlo a un evento.

## 8. Reglas para mantener el ancla

1. **Antes de programar** una funcionalidad, ubicar su requerimiento (RF/RNF) en la sección 6.
2. **Endpoints nuevos o cambiados** → actualizar la sección 4 y el decorador `@ApiOperation` de Swagger.
3. **Campos de esquema nuevos o cambiados** → actualizar la sección 3; si contradicen al PDF, agregar un desvío en la sección 5.
4. **DTOs, enums y nombres de mensajes TCP** viven solo en `backend/libs/contracts`. Nunca duplicarlos en un servicio.
5. El **frontend** usa siempre `API_URL` de `frontend/src/config.ts`; nunca una URL fija ni un puerto de microservicio.
   Los montos se muestran siempre con `formatARS` (`frontend/src/utils/currency.ts`): pesos argentinos, `$ 4.000` / `$ 2.550,50`.
6. Los microservicios lanzan `HttpException` (`NotFoundException`, `ConflictException`…) y registran
   `HttpToRpcExceptionFilter`; el gateway traduce con `UserClient` o `MarketClient`, que además aplican un timeout.
7. Ningún secreto en archivos versionados: solo en `backend/.env` y `frontend/.env` (ignorados por git).
8. Al cerrar un sprint, revisar que la sección 6 refleje el estado real y actualizar la tabla de
   estimación Fibonacci del PDF.
