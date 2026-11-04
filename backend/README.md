# All Pets — Backend (monorepo NestJS)

Backend de **All Pets** con arquitectura de microservicios: un **API Gateway** HTTP que es el único
punto de entrada para el frontend, y microservicios que se comunican con él por **TCP** interno de NestJS.

> ⚓ El contrato completo (endpoints, esquemas, roles, estado de requerimientos) está en
> [docs/ANCLA.md](../docs/ANCLA.md). Si cambiás un endpoint o un esquema, actualizalo ahí también.

## Arquitectura

```
backend/
├── apps/
│   ├── api-gateway/          # HTTP :3000 — JWT, roles, rate limiting, subida de imágenes, Swagger
│   ├── core-user-service/    # TCP :3001 — usuarios, auth, perfiles profesionales, reseñas (MongoDB allpets_users)
│   └── market-service/       # TCP :3002 — productos y carrito (MongoDB allpets)
├── libs/
│   ├── common/               # Validación de variables de entorno y errores RPC ↔ HTTP
│   └── contracts/            # DTOs, enums y patrones de mensajes TCP compartidos
├── uploads/                  # Imágenes subidas (no se versionan)
└── nest-cli.json
```

Cómo viajan los errores: los microservicios lanzan excepciones HTTP de Nest
(`NotFoundException`, `ConflictException`, `UnauthorizedException`…). El filtro
`HttpToRpcExceptionFilter` (en `libs/common`) las serializa por TCP con su código, y el gateway
las reconstruye con `rpcErrorToHttpException` / `MarketClient`. Así el frontend recibe, por ejemplo,
`409 El correo electrónico ya está registrado.` en lugar de un error genérico.

## Requisitos

- **Node.js** 22.18+ (o 24.12+)
- **MongoDB** en `mongodb://127.0.0.1:27017` (`docker compose up -d mongo` desde la raíz del proyecto)

## Configuración (`.env`)

Copiá [`.env.example`](.env.example) como `.env` dentro de `backend/` y completá los secretos.
Los tres servicios leen el mismo archivo. Al arrancar, cada uno valida sus variables con un esquema
de Joi (`libs/common/src/config/env.validation.ts`): si falta una obligatoria o es inválida, no arranca.

```bash
cp .env.example .env
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# Generar PHONE_ENCRYPTION_KEY (32 bytes en base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

| Variable | Servicio | Descripción |
|---|---|---|
| `PORT` | gateway | Puerto HTTP (3000) |
| `USER_SERVICE_HOST` / `USER_SERVICE_PORT` | gateway | Dónde escucha el core-user-service |
| `MARKET_SERVICE_HOST` / `MARKET_SERVICE_PORT` | gateway | Dónde escucha el market-service |
| `CORS_ORIGINS` | gateway | Orígenes del frontend, separados por comas. Obligatorio en producción |
| `TRUST_PROXY_HOPS` | gateway | Opcional. Cantidad de proxies propios delante del gateway |
| `REDIS_URL` | gateway | Opcional. Comparte el límite de peticiones entre instancias |
| `PORT_USER_SERVICE_TCP` | core-user | Puerto TCP (3001) |
| `USER_SERVICE_BIND_HOST` | core-user | Opcional. Interfaz del TCP (`127.0.0.1` por defecto) |
| `MONGO_URI_USERS` | core-user | Base de usuarios |
| `JWT_SECRET` / `JWT_EXPIRATION` | gateway y core-user | Firma y duración del token |
| `PHONE_ENCRYPTION_KEY` | core-user | Clave AES-256-GCM para cifrar teléfonos |
| `PORT_MARKET_SERVICE_TCP` | market | Puerto TCP (3002) |
| `MARKET_SERVICE_BIND_HOST` | market | Opcional. Interfaz del TCP (`127.0.0.1` por defecto) |
| `MONGO_URI_MARKET` | market | Base de la tienda |

> ⚠️ Nunca pongas valores reales en archivos versionados (README, ejemplos, código).
> Si un secreto se publicó alguna vez, hay que **rotarlo** (ver [Mantenimiento](#mantenimiento)).

## Ejecución

Cada servicio en su propia terminal:

```bash
npm run start:user      # core-user-service (TCP 3001)
npm run start:market    # market-service    (TCP 3002)
npm run start:gateway   # API Gateway       (HTTP 3000)
```

Compilación: `npm run build:all` (o `build`, `build:user`, `build:market` por separado).

## Pruebas y calidad

```bash
npm test                  # Unit + integración gateway ↔ market por TCP (no necesita MongoDB)
npm run test:integration  # Flujo real registro → login → perfil (requiere los servicios levantados)
npm run lint              # Corrige lo que puede (npm run lint:check solo informa, como en CI)
npm run format
```

## Mantenimiento

Se ejecutan desde `backend/`. Sin `--apply` solo informan qué harían.

```bash
npm run secrets:rotate -- --apply     # Nuevo JWT_SECRET y PHONE_ENCRYPTION_KEY; vuelve a cifrar los teléfonos (con los servicios detenidos)
npm run migrate:cert-docs -- --apply  # Mueve los comprobantes viejos de uploads/ a private-uploads/
```

## Endpoints

Lista completa con permisos y bodies en [docs/ANCLA.md § Endpoints](../docs/ANCLA.md#4-endpoints-del-api-gateway).
Resumen:

| Grupo | Rutas |
|---|---|
| Autenticación | `POST /auth/register`, `POST /auth/login` |
| Usuarios | `GET/PUT/DELETE /users/:id`, `GET /users` (admin), `POST /users/:userId/image` |
| Perfil profesional | `GET/PUT /users/:userId/caregiver-profile`, subidas de `image`, `gallery`, `certifications`; `DELETE` de una foto o comprobante; `GET` de un comprobante |
| Directorio público | `GET /caregivers` (filtros y paginación), `GET /caregivers/:userId`, `GET /caregivers/:userId/profile`, `GET /caregivers/:caregiverId/reviews`; `GET /caregivers/:userId/contact` (con sesión) |
| Reseñas | `POST /reviews` (client), `PATCH/DELETE /reviews/:reviewId` (autor), `GET /reviews/caregiver/:caregiverId`, `GET /reviews/caregiver/:caregiverId/mine` (client) |
| Administración | `GET /admin/caregivers`, `GET /admin/caregivers/:userId`, `PATCH /admin/caregivers/:userId/status` |
| Tienda | `GET /products` (filtros, paginación y opciones de filtro), `GET /products/:id`, `POST/PATCH/DELETE /products` y `POST /products/image` (admin), `/cart` y `/cart/items` |
| Salud | `GET /health` |

## Swagger (OpenAPI 3)

- UI: <http://localhost:3000/api/docs> · JSON: <http://localhost:3000/api/docs-json>
- En producción (`NODE_ENV=production`) está deshabilitado salvo `SWAGGER_ENABLED=true`, y en ese caso
  pide `SWAGGER_USER` / `SWAGGER_PASSWORD`.

Para probar endpoints protegidos: ejecutá `POST /auth/login`, copiá el `access_token`, tocá
**Authorize 🔓** y pegalo (sin la palabra `Bearer`).

## Seguridad implementada

- **bcrypt** (10 rondas) para contraseñas; el hash nunca sale en las respuestas.
- **AES-256-GCM** para teléfonos en reposo; solo se entregan con sesión, de a uno.
- **JWT** validado en el gateway (también que la cuenta siga existiendo), **guards por rol** (`client`, `walker`, `caregiver`, `admin`) y por **dueño del recurso**.
- **Rate limiting** global (120 req/min por IP) y estricto en login (5/min), registro (5 cada 15 min) y subidas (10/min).
- **Subidas** solo JPG/PNG/WEBP de hasta 5 MB, con nombre aleatorio y extensión según el tipo real.
- **Comprobantes de certificación** fuera de la carpeta pública: solo los ven el dueño y el admin.
- El registro público **no permite** crear administradores.
- **helmet** y **CORS** limitado a los orígenes del frontend.
- Cada respuesta lleva un `x-request-id` que también aparece en el log del gateway.
