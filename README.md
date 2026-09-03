# Sistema de Alerta Temprana y Reporte de Incendios

Plataforma para la detección temprana, el reporte ciudadano y el monitoreo en
tiempo real de incendios, integrando sensores de hardware, un backend de
gestión y clientes de visualización.

[Ver demo](#) · [Reportar error](#) · [Solicitar función](#)

---

## 📑 Tabla de contenidos

- [📌 Sobre el proyecto](#-sobre-el-proyecto)
- [🧩 Componentes](#-componentes)
- [🛠️ Construido con](#️-construido-con)
- [⚙️ Empezar](#️-empezar)
- [🧪 Uso](#-uso)
- [📚 Documentación adicional](#-documentación-adicional)
- [📝 Licencia](#-licencia)
- [🙌 Reconocimientos](#-reconocimientos)

---

## 📌 Sobre el proyecto

El sistema permite recibir señales de sensores y reportes de usuarios,
evaluar el nivel de riesgo, emitir alertas y dar seguimiento a los incendios
reportados, con notificaciones en tiempo real hacia los responsables.

✅ Objetivos:

- **Backend** en Node.js + Express siguiendo **Clean Architecture**.
- **Base de datos** PostgreSQL como almacén relacional.
- **Frontend** de visualización y gestión — *stack por definir*.
- **Hardware** de sensado y envío de datos — *stack por definir*.
- Arquitectura por capas, desacoplada del framework y de la base de datos.

---

## 🧩 Componentes

| Módulo | Carpeta | Estado |
| ------ | ------- | ------ |
| Backend / API REST | [`backend/`](backend/) | En desarrollo — configuración y capa de entrega mínima operativas |
| Base de datos | [`base de datos/`](base%20de%20datos/) | En diseño — motor definido: **PostgreSQL** |
| Frontend | [`frontend/`](frontend/) | ⏳ Pendiente de definición (tecnología y alcance) |
| Hardware | [`hardware/`](hardware/) | ⏳ Pendiente de definición (plataforma, sensores y firmware) |

---

## 🛠️ Construido con

### Backend

- Node.js (ESM)
- Express 5
- dotenv, cors, morgan
- Clean Architecture (Domain / Application / Infrastructure / Routes)

Planificado: Prisma ORM, Socket.IO (tiempo real), Zod (validación),
JWT + bcrypt (autenticación), Swagger. Ver [`backend/readme.md`](backend/readme.md).

### Base de datos

- PostgreSQL

### Frontend

⏳ **Pendiente de definición.** Aún no se ha decidido framework, librerías ni
arquitectura del cliente.

### Hardware

⏳ **Pendiente de definición.** Aún no se ha decidido la plataforma de los
sensores, el protocolo de comunicación ni el lenguaje del firmware.

---

## ⚙️ Empezar

### Prerrequisitos

#### Backend

- Node.js v18+ (probado con v24)
- PostgreSQL 14 o superior
- npm 9+

#### Base de datos

- Instancia de PostgreSQL accesible (local o en contenedor)

#### Frontend

⏳ Pendiente de definición.

#### Hardware

⏳ Pendiente de definición.

### Instalación

#### Clonar el repositorio

```bash
git clone https://github.com/deymar1030/Sistema-de-alerta-temprana-y-reporte-de-incendios
cd Sistema-de-alerta-temprana-y-reporte-de-incendios
```

Para el flujo de ramas, commits y PR ver [`GitCommands.md`](GitCommands.md) y
[`GitRules.md`](GitRules.md).

#### Backend

```bash
cd backend
cp .env.example .env      # ajustar PORT y, más adelante, la conexión a PostgreSQL
npm install
npm run dev               # recarga en caliente
# o
npm start
```

Servidor por defecto en `http://localhost:3000`.

---

## 🧪 Uso

Se puede interactuar con el backend mediante Postman, curl o el navegador:

```bash
GET http://localhost:3000/
GET http://localhost:3000/api/health
```

Respuesta de `GET /api/health`:

```json
{ "status": "ok", "uptime": 12.34 }
```

---

## 📚 Documentación adicional

- Backend: [`backend/readme.md`](backend/readme.md)
- Base de datos: [`base de datos/readme.md`](base%20de%20datos/readme.md)
- Frontend: [`frontend/readme.md`](frontend/readme.md) *(pendiente)*
- Hardware: [`hardware/readme.md`](hardware/readme.md) *(pendiente)*

Enlace a la documentación general: *pendiente de publicar*.

---

## 📝 Licencia

Por definir.

---

## 🙌 Reconocimientos

Proyecto académico — UMSA, Taller de Proyecto, 2026.
