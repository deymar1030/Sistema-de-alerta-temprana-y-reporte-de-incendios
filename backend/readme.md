# Backend — Sistema de alerta temprana y reporte de incendios

API REST con Node.js + Express (ESM).

## Stack tecnológico

### En uso

| Herramienta | Rol |
| ----------- | --- |
| **Node.js** (ESM) | Entorno de ejecución |
| **Express 5** | Framework HTTP / capa de entrega |
| **dotenv** | Carga de variables de entorno (`.env`) |
| **cors** | Habilita peticiones desde el frontend (otro origen) |
| **morgan** | Logger de peticiones HTTP en consola |
| **npm** | Gestor de paquetes |

### Planificado

| Herramienta | Rol |
| ----------- | --- |
| **PostgreSQL** | Base de datos relacional |
| **Prisma** | ORM y motor de migraciones (`schema.prisma`, `prisma migrate`) |
| **Socket.IO** | Notificaciones en tiempo real (alertas de incendio) |
| **Zod** | Validación de los datos de entrada (request → DTO) |
| **jsonwebtoken** + **bcrypt** | Autenticación y hash de contraseñas |
| **Swagger / OpenAPI** | Documentación de la API |
| **Vitest** o **Jest** | Pruebas unitarias de dominio y casos de uso |
| **ESLint** + **Prettier** | Estilo y calidad de código |

## Requisitos

- Node.js 18+ (probado con v24)

## Arquitectura

El backend sigue **Clean Architecture**: el código se organiza en capas
concéntricas donde las dependencias apuntan siempre **hacia adentro**. Las
reglas de negocio no conocen a Express, ni a la base de datos, ni a ninguna
librería externa; son los detalles (framework HTTP, ORM, drivers) los que
dependen del núcleo y no al revés.

### Objetivos

- **Independencia del framework**: Express es un detalle de entrega. Cambiarlo
  (por Fastify, por una cola de mensajes, etc.) no debería tocar la lógica.
- **Independencia de la base de datos**: los casos de uso hablan con
  *interfaces* de repositorio, no con PostgreSQL directamente.
- **Testabilidad**: la lógica de negocio se prueba sin levantar el servidor ni
  la base de datos, inyectando repositorios falsos (mocks).
- **Reglas de negocio explícitas y en un solo lugar**: entidades y casos de uso
  concentran el "qué hace el sistema".

### Capas

| Capa | Contiene | Depende de |
| ---- | -------- | ---------- |
| **Domain** (núcleo) | Entidades, objetos de valor, reglas de negocio puras y las *interfaces* de repositorio | Nada |
| **Application** (casos de uso) | Orquesta el dominio para cumplir una acción concreta (ej. `RegistrarReporteDeIncendio`, `EmitirAlerta`). Define DTOs de entrada/salida | Domain |
| **Infrastructure** | Implementaciones concretas: repositorios sobre PostgreSQL, cliente de hardware/sensores, envío de notificaciones, adaptadores de librerías | Application, Domain |
| **Routes** (entrega) | Express: routers, controladores, middlewares, validación de request, mapeo a códigos HTTP | Application |

**Regla de dependencia**: `Routes → Application → Domain` e
`Infrastructure → (Application, Domain)`. El dominio nunca importa de las capas
externas. La comunicación de afuera hacia adentro se hace por **inyección de
dependencias** (los controladores reciben casos de uso ya construidos; los casos
de uso reciben repositorios).

### Flujo de una petición

```
HTTP request
  → Router (Presentation)
  → Controller: valida input, arma el DTO
  → Caso de uso (Application): aplica reglas usando Entidades (Domain)
        usa → Repositorio (interface Domain) --impl--> Infrastructure (PostgreSQL)
  → Controller: mapea el resultado a JSON + status
HTTP response
```


## Puesta en marcha

```bash
cd backend
cp .env.example .env
npm install
npm run dev    # recarga en caliente (node --watch)
# o
npm start
```

Servidor por defecto en `http://localhost:3000`.

## Endpoints actuales

| Método | Ruta              | Descripción                |
| ------ | ----------------- | -------------------------- |
| GET    | `/`               | Info de la API             |
| GET    | `/api/health`     | Estado del servicio        |
