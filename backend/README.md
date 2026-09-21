# All Pets — Backend Monorepo (NestJS)

Monorepo de backend para la plataforma **All Pets**, desarrollado con **NestJS** y arquitectura basada en microservicios desacoplados con comunicación interna vía TCP y un API Gateway centralizado para el frontend.

---

## 🏗 Arquitectura de Servicios

```
backend/
├── apps/
│   ├── api-gateway/          # Punto de entrada HTTP público (Auth JWT, Rate Limiting, Subida de Archivos)
│   ├── core-user-service/    # Microservicio TCP: Usuarios, Roles, Perfiles, Cifrado, Reseñas (MongoDB)
│   └── market-service/       # Microservicio TCP: Catálogo de productos y órdenes (esqueleto)
├── libs/
│   ├── common/               # Utilidades, validaciones de variables de entorno compartidas
│   └── contracts/            # DTOs, Enums e Interfaces compartidas (contratos de comunicación)
├── uploads/                  # Directorio local de almacenamiento de imágenes
└── nest-cli.json             # Configuración monorepo NestJS
```

---

## 🚀 Requisitos Previos

- **Node.js**: v18+ (recomendado LTS)
- **MongoDB**: Instancia local corriendo en `mongodb://localhost:27017` o vía Docker
- **Docker Compose** (opcional, en la raíz del proyecto para levantar MongoDB y Redis)

---

## ⚙️ Configuración (.env)

Crear un archivo `.env` dentro de la carpeta `backend/` basándose en `.env.example`:

```env
# API Gateway
PORT=3000
USER_SERVICE_HOST=127.0.0.1
USER_SERVICE_PORT=3001

# Core User Service
PORT_USER_SERVICE_TCP=3001
MONGO_URI_USERS=mongodb://127.0.0.1:27017/allpets_users
JWT_SECRET=supersecretallpetskey2026
JWT_EXPIRATION=7d

# Clave base64 de 32 bytes para cifrado simétrico AES-256-GCM de teléfonos
PHONE_ENCRYPTION_KEY=fB5g/3wJkgDLOVYAuMMIF7My5ux/2NDxRm4jt9TrV7U=
```

---

## 💻 Comandos de Ejecución

### 1. Iniciar Microservicio de Usuarios (Core User Service)
```bash
npm run start:user
```

### 2. Iniciar API Gateway (HTTP en puerto 3000)
```bash
npm run start:gateway
# o
npm run start:dev
```

### 3. Compilación de Todos los Servicios (Build)
```bash
npm run build:all
```

### 4. Pruebas y Calidad de Código
```bash
# Pruebas unitarias
npm test

# Pruebas de integración automatizadas E2E (auth, registro, perfiles)
npm run test:integration

# Linting y formato
npm run lint
```

---

## 🛡️ Seguridad Implementada
- **Bcrypt:** Hasheo unidireccional de contraseñas (salt factor 10). Exclusión garantizada de hashes en respuestas públicas.
- **AES-256-GCM:** Cifrado criptográfico de datos sensibles (teléfonos de contacto) en reposo (MongoDB).
- **JWT & Role Guards:** Validación estricta de tokens en el Gateway y control de acceso basado en roles (`client`, `walker`, `caregiver`, `admin`).
- **Control de Propietario:** Verificación de que cada usuario solo puede editar sus propios datos.
