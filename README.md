# All Pets 🐶🐱

Plataforma web para comprar productos para mascotas y encontrar paseadores y cuidadores
de confianza en Cipolletti y Neuquén.

Proyecto de **Práctica Profesionalizante III** — Tecnicatura Superior en Desarrollo de Software
Full Stack, Instituto Técnico Superior Cipolletti (cursada 2026).
Docente: Roberto Aqueveque · Integrantes: Yair Melinguer (Product Owner) y Lucas Durán (Scrum Master).

> ⚓ **[docs/ANCLA.md](docs/ANCLA.md)** es la referencia que une la documentación oficial (PDF)
> con el código: arquitectura, modelo de datos, endpoints, estado de cada requerimiento y
> desvíos aceptados. Cualquier cambio de contrato se registra ahí.

## Qué hay en el repositorio

```
ALL PETS PP 3/
├── frontend/            # Vue 3 + Pinia + Vue Router + Tailwind CSS 4 (Vite)
├── backend/             # Monorepo NestJS
│   ├── apps/
│   │   ├── api-gateway/        # HTTP :3000 — único punto de entrada (JWT, rate limiting, uploads, Swagger)
│   │   ├── core-user-service/  # TCP :3001 — usuarios, auth, perfiles profesionales, reseñas
│   │   └── market-service/     # TCP :3002 — productos y carrito
│   └── libs/
│       ├── common/             # Validación de entorno y manejo de errores entre servicios
│       └── contracts/          # DTOs, enums y nombres de mensajes TCP compartidos
├── docs/ANCLA.md        # Contrato documentación ↔ código
└── docker-compose.yml   # MongoDB, Redis y, con --profile app, la aplicación completa
```

El **Booking & Location Service** (reservas y GPS en tiempo real) está postergado, como indica la documentación.

## Puesta en marcha rápida

Requisitos: Node.js 22.18+ (o 24.12+), npm y MongoDB (local o con Docker).

```bash
# 1. Bases de datos
docker compose up -d mongo

# 2. Backend
cd backend
npm install
cp .env.example .env        # completar JWT_SECRET y PHONE_ENCRYPTION_KEY
npm run start:user          # terminal 1 — core-user-service
npm run start:market        # terminal 2 — market-service
npm run start:gateway       # terminal 3 — API Gateway en http://localhost:3000

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

- Documentación interactiva de la API: <http://localhost:3000/api/docs>
- Estado de los servicios: <http://localhost:3000/health>

Más detalle en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

## Funcionalidades actuales

| Para quién | Qué puede hacer |
|---|---|
| Dueños de mascotas (`client`) | Registrarse, buscar paseadores y cuidadores por ciudad, tipo, tarifa y tamaño de mascota, ver su perfil y contactarlos por WhatsApp, dejar reseñas, comprar en la tienda con carrito |
| Paseadores y cuidadores (`walker`, `caregiver`) | Registrarse, completar su perfil profesional (tarifa, servicios, disponibilidad, galería, certificaciones) y aparecer en el directorio una vez aprobados |
| Administradores (`admin`) | Aprobar, rechazar, editar o eliminar prestadores; crear, editar y eliminar productos |

Pendiente según la documentación: pagos con Mercado Pago, notificaciones por email y
el servicio de reservas con geolocalización. El detalle está en
[docs/ANCLA.md § Requerimientos](docs/ANCLA.md#6-requerimientos-estado-de-cumplimiento).

## Gestión del proyecto

- Metodología: Scrum, con backlog e historias de usuario en Jira.
- Ramas: una por funcionalidad (*feature branches*); `main` es la rama estable.
