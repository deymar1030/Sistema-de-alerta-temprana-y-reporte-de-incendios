# Feature: Auditoría (solo lectura, rol AUDITOR)

#### Detalle:
necesitamos exponer las tablas de auditoría del sistema por un endpoint de **solo
lectura** — un `GET` de las listas de esas tablas, sin que se puedan modificar ni desde
el backend ni desde el frontend; solo se escriben directamente en la base de datos
(triggers a cargo del equipo de seguridad, fuera de este repositorio). Esta vista solo
está disponible para un usuario de rol `AUDITOR`, y para ese rol es la **única** vista
que existe en la app — no tiene dashboard, ni configuración, ni ninguna otra pantalla.

Implementado en: `backend/api/interfaces/features/auditoriaRoter/` (backend);
`frontend/src/views/AuditView.vue`, `frontend/src/services/audit.service.ts`,
`frontend/src/stores/audit.store.ts`, `frontend/src/router/index.ts` (rutas `/auditor/*`),
`frontend/src/layouts/MonitoringLayout.vue` (`navByRole.AUDITOR`) (web).

## Métodos usados

Get: `api/auditoria`
- Requiere sesión con rol `AUDITOR` (403 para cualquier otro rol, incluido `ADMIN`).
- Query params opcionales: `evento`, `desde`, `hasta` (filtra por `fecha_hora`).
- Response (`data`, array) — refleja 1:1 la tabla `auditoria`:
```json
[
  { "id_auditoria": "12", "evento": "LOGIN", "fecha_hora": "2026-10-29T14:32:00.000Z", "detalle": "Inicio de sesion correo@ejemplo.com" }
]
```

Get: `api/auditoria/usuarios`
- Requiere sesión con rol `AUDITOR`.
- Query params opcionales: `id_usuario`, `accion`, `desde`, `hasta`.
- Response (`data`, array) — refleja 1:1 la tabla `auditoriau`:
```json
[
  { "id_auditoriau": "45", "id_usuario": "7", "accion": "EDITAR_USUARIO", "detalle": "Cambio de rol", "fecha_hora": "2026-10-29T14:40:00.000Z", "ip_origen": "190.12.34.56" }
]
```

**No hay `POST`/`PUT`/`PATCH`/`DELETE` para ninguna de las dos** — ni en el router, ni en
el repositorio (`AuditoriaRepository` solo declara `findAll`/`findAllUsuario`), a
propósito. No se agregó ningún trigger ni cambio de esquema en la base de datos: eso
queda fuera de este repositorio, a cargo de seguridad.

## Acceso (rol AUDITOR)

- El rol `AUDITOR` se crea igual que `JEFE_INSTITUCION`/`OPERATIVO`: no hay seeding
  automático, se crea la fila en `rol` a mano (o vía `npm run crear-usuario`) con
  `nombre_rol = 'AUDITOR'` exacto.
- En el formulario de creación de usuarios (`SuperAdminUsersView.vue`) el rol `AUDITOR`
  es visible para **filtrar** la lista, pero a propósito no es asignable desde ahí — ya
  estaba así antes de esta feature (ver el comentario "AUDITOR es un rol válido para
  listar, pero no se habilita su asignación" en ese archivo).
- Al iniciar sesión, un usuario `AUDITOR` cae directo en `/auditor/auditoria`
  (`homeForRole` en `main.ts`). Cualquier otra ruta bajo `/auditor/*` redirige ahí mismo
  (`/auditor/:pathMatch(.*)*`), y cualquier ruta fuera de `/auditor` (dashboard, otras
  instituciones, etc.) también — el guard de rutas (`meta.roles`) lo rechaza.
- El menú lateral (`navByRole.AUDITOR` en `MonitoringLayout.vue`) tiene un solo ítem:
  "Auditoría". El botón "Configuración" del menú de perfil se oculta para este rol
  (no existe esa pantalla para `AUDITOR`).
- `ADMIN` también puede ver esta misma vista en `/super-admin/auditoria` (reutiliza el
  mismo componente `AuditView.vue`).

## Sugerencia de cómo debería ser la vista

Ya implementado así: dos listas separadas (eventos del sistema / acciones por usuario),
cada una con sus propios filtros simples (evento o id de usuario/acción, rango de
fechas) y un botón "Filtrar" — sin ninguna acción de edición, borrado ni creación en
ningún lado de la pantalla.
