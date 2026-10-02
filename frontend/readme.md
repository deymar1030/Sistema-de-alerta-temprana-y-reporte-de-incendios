# ALERTA — Prevención de Incendios

Frontend web demostrativo para monitoreo central y administración institucional de emergencias por incendios.

El frontend web está destinado a Operador Central y Admin de Institución. Los roles Ciudadano y Usuario de Institución se implementan en la aplicación móvil ALERTA.

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

También existe un selector **Modo demostración** en el sidebar para cambiar entre los dos roles web.

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

Las rutas web `/institucion/...` y `/ciudadano/...` redirigen al login. Las interfaces operativas de esos roles pertenecen a `ALERTA_Movil`.

## Flujo demo recomendado

1. Ingresar como **Operador Central**.
2. Abrir `Alertas` y revisar reportes ciudadanos pendientes.
3. Revisar el mapa y las instituciones cercanas.
4. Seleccionar una institución y despachar manualmente.
5. Revisar incidentes, historial y bitácora.
6. Ingresar como **Admin Institución** para consultar alertas, personal e informes de atención.

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

## Contratos de datos

Actualmente el frontend web sigue el flujo `Views -> Pinia Stores -> Services -> mocks`; sus services son de demostración y no realizan llamadas de red. La app móvil todavía no tiene una capa propia de mocks, services o stores.

Los tipos objetivo para una futura integración están en `src/types/contracts.ts` y, duplicados para mantener los proyectos independientes, en `ALERTA_Movil/src/types/contracts.ts`. Los modelos legacy que consumen las vistas se conservan temporalmente; cualquier respuesta API deberá mapearse a ellos hasta migrar las vistas.

El documento [Contratos de datos del frontend](docs/frontend-data-contracts.md) define enums, campos requeridos/opcionales, fechas ISO 8601, relaciones y ejemplos JSON ficticios. No hay API ni persistencia implementadas.
