# ALERTA — Prevención de Incendios

Frontend demostrativo para un sistema de detección temprana, monitoreo, reporte ciudadano y coordinación institucional de emergencias por incendios.

Esta versión reorganiza las vistas por rol, recupera el mapa como elemento central del Centro de Monitoreo y evita la repetición de pantallas que existía en la versión anterior.

## Tecnologías

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Tailwind CSS
- Leaflet
- Chart.js
- Lucide Vue

## Identidad visual

Se conserva la línea visual clara de ALERTA:

- fondos blancos/gris muy suave;
- beige claro para énfasis;
- verde salvia para estados correctos;
- naranja como color de marca;
- amarillo para advertencias;
- rojo únicamente para situaciones críticas;
- tipografía y bordes discretos.

Los logos están en `public/logo-alerta.svg` y `public/logo-alerta-ave.svg`.

## Instalación

No se debe compartir `node_modules`.

```bash
npm install
npm run dev
```

Para validar el proyecto:

```bash
npm run build
```

## Acceso demo

El proyecto todavía no utiliza autenticación real. El login simula el usuario que en el futuro devolverá el backend.

Contraseña visual de demostración: `demo123`.

Cuentas:

| Rol | Correo |
|---|---|
| Operador Central | `operador@alerta.bo` |
| Admin Institución | `admin.bomberos@alerta.bo` |
| Usuario Institución | `operativo@alerta.bo` |
| Ciudadano | `ciudadano@alerta.bo` |

También existe un selector **Modo demostración** en el sidebar para cambiar rápidamente de rol.

## Roles y vistas

### 1. Operador Central

Rutas principales:

- `/central/dashboard`
- `/central/alertas`
- `/central/incidentes`
- `/central/instituciones`
- `/central/historial`

Funciones:

- mapa operativo con sensores, incidentes, reportes ciudadanos e instituciones;
- visualización de puntos de peligro;
- validación de reportes ciudadanos;
- selección manual de instituciones cercanas;
- despacho manual;
- seguimiento del estado de cada institución;
- cronología del incidente;
- historial y bitácora.

### 2. Administrador de Institución

Rutas principales:

- `/admin-institucion/dashboard`
- `/admin-institucion/alertas`
- `/admin-institucion/sensores`
- `/admin-institucion/lecturas`
- `/admin-institucion/motor`
- `/admin-institucion/usuarios`
- `/admin-institucion/informes`
- `/admin-institucion/historial`

Funciones:

- consulta de alertas asignadas únicamente a su institución;
- vistas técnicas de sensores, lecturas y motor;
- gestión demo de personal;
- informes estructurados de atención;
- adjunto PDF como respaldo;
- registro de tiempos, personal, vehículos, afectados y resultados;
- historial institucional.

### 3. Usuario de Institución

Rutas:

- `/institucion/dashboard`
- `/institucion/emergencias`
- `/institucion/historial`

Funciones:

- recibe únicamente emergencias despachadas a su institución;
- confirma recepción;
- marca unidad en camino;
- confirma llegada;
- marca incidente controlado;
- finaliza intervención;
- cada acción queda registrada con fecha/hora en el timeline y bitácora.

### 4. Ciudadano

Rutas:

- `/ciudadano/inicio`
- `/ciudadano/reportar`
- `/ciudadano/mis-reportes`
- `/ciudadano/notificaciones`
- `/ciudadano/instrucciones`

Funciones:

- reportar una situación con descripción, ubicación y fotografía;
- seguimiento del reporte;
- notificaciones diferenciadas;
- instrucciones generales de emergencia.

Un reporte ciudadano **no se confirma automáticamente** como incendio. Primero queda pendiente de revisión por el Operador Central.

## Flujo demo recomendado

1. Ingresar como **Ciudadano**.
2. Crear un reporte con ubicación y, opcionalmente, fotografía.
3. Cambiar a **Operador Central**.
4. Abrir `Alertas` y validar el reporte.
5. Revisar el mapa y las instituciones cercanas.
6. Seleccionar una institución y despachar manualmente.
7. Cambiar a **Usuario Institución**.
8. Abrir la emergencia y actualizar sus estados operativos.
9. Cambiar a **Admin Institución**.
10. Crear el informe de atención y adjuntar un PDF.
11. Volver a **Operador Central** y revisar historial/bitácora.

## Estructura

```text
src/
├── components/
│   ├── common/
│   └── dashboard/
├── layouts/
├── mocks/
├── router/
├── services/
├── stores/
├── types/
├── views/
├── App.vue
├── main.ts
└── style.css
```

## Diseño de datos importante

Se separan dos conceptos:

- `Incident.status`: estado general del incidente.
- `Dispatch.status`: estado particular de cada institución despachada.

Esto permite que, por ejemplo, Bomberos esté `EN_CAMINO` mientras Policía todavía figure `ENVIADA`.

Además, `IncidentTimelineEvent` registra eventos cronológicos reales del prototipo, en lugar de deducir toda la línea de tiempo únicamente desde el estado actual.

## Datos de demostración

Los sensores, ubicaciones, distancias, disponibilidades, tiempos y métricas son **datos simulados**.

No representan:

- umbrales técnicos certificados;
- tiempos oficiales de respuesta;
- disponibilidad real de instituciones;
- información operativa en tiempo real.

## Preparación para backend

La UI utiliza `stores` y `services` para no acoplar las vistas directamente a los mocks.

La sustitución futura esperada es:

```text
Vue View
   ↓
Pinia Store
   ↓
Service
   ↓
API REST / WebSocket
   ↓
Backend / Base de datos
```

La autenticación real deberá validar correo/contraseña en backend y devolver usuario, rol y sesión/token. Los guards del frontend seguirán siendo útiles para UX, pero la autorización definitiva debe aplicarse también en backend.
