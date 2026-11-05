# Feature: Disponibilidad de institución

#### Detalle:
la idea es generar las funciones necesarias para que una institución indique
cuándo está disponible para atender alertas. Existen 2 escenarios: el primero es el
simple botón que hace que una institución se marque como no disponible (o vuelva a
disponible); el segundo es cuando la institución no tiene personal (OPERATIVO) libre
para enviar — este último **no tiene endpoint propio ni cambia `disponibilidad_operativa`
automáticamente**: solo depende del JEFE_INSTITUCION decidirlo a mano con el botón del
primer escenario. En el frontend, el segundo escenario debe mostrarse como una
notificación/aviso informativo (ver sección "Segundo escenario" más abajo), nunca como
un cambio de estado automático.

Implementado en: `backend/api/interfaces/features/institucionRoter/`. Ya consumido en
`InstitutionAdminDashboardView.vue` + `institution.store.ts`/`institution.service.ts`
como referencia de implementación.

## Métodos usados

Get: `api/instituciones`
- Lista todas las instituciones activas. Sin body. Requiere sesión (cualquier rol).
- Response (`data`, array):
```json
[
  {
    "id_institucion": 3,
    "categoria": "BOMBEROS",
    "nombre": "Bomberos Voluntarios La Paz",
    "razon_social": "Cuerpo de Bomberos Voluntarios de La Paz",
    "detalle": "Estación central",
    "direccion": "Av. Montes 1234",
    "telefono_ins": "+591 2 2345678",
    "latitud": -16.5,
    "longitud": -68.15,
    "estado": true,
    "disponibilidad_operativa": "DISPONIBLE"
  }
]
```
- `disponibilidad_operativa` puede venir `null` (nunca configurada: tratar como
  `DISPONIBLE`), `"DISPONIBLE"`, `"ATENDIENDO"` o `"NO_DISPONIBLE"`.

Get: `api/instituciones/:id`
- Mismo shape que un elemento del listado anterior, para una sola institución.

Patch: `api/instituciones/:id/disponibilidad` (nuevo)
- Requiere sesión con rol `JEFE_INSTITUCION`, y `:id` debe ser la propia institución del
  usuario autenticado (si no, 400: `"No puedes cambiar la disponibilidad de otra institucion"`).
  Si el rol no es `JEFE_INSTITUCION`: 403 `{ "error": "No tiene permisos para esta acción", "code": "FORBIDDEN" }`.
- body:
```json
{ "disponibilidad_operativa": "DISPONIBLE" }
```
  Valores válidos: `"DISPONIBLE" | "ATENDIENDO" | "NO_DISPONIBLE"`.
- Response (`data`): la institución actualizada, mismo shape que `GET /instituciones/:id`.
- Efecto en el motor de alertas: mientras `disponibilidad_operativa` sea `NO_DISPONIBLE`,
  esa institución deja de recibir alertas nuevas (`distribuirAlerta` la excluye). Al
  volver a `DISPONIBLE`/`ATENDIENDO`, vuelve a recibirlas con normalidad.

## Segundo escenario (sin personal disponible) — sin endpoint propio

No hay un endpoint que calcule "me quedé sin operativos". El frontend puede derivarlo
sin pedir nada nuevo: `GET /usuarios/operativos` (ver
`frontend/docs/features/asignacion-operativos.md`) ya devuelve `disponible: boolean` por
cada operativo de la institución del `JEFE_INSTITUCION` logueado. Si **todos** los
operativos devueltos tienen `disponible: false`, mostrar un aviso tipo "No tienes
operativos libres en este momento" en el dashboard — sin tocar
`disponibilidad_operativa`. Esa decisión queda siempre en manos del JEFE con el botón
del primer escenario.

## Sugerencia de cómo debería ser la vista

- Un indicador de estado (pill/badge) con el valor actual de `disponibilidad_operativa`
  — verde para `DISPONIBLE`/`ATENDIENDO`, rojo para `NO_DISPONIBLE`.
- Un botón único que alterna entre "Marcar como no disponible" y "Marcar como
  disponible" según el estado actual (no un selector de 3 valores: `ATENDIENDO` es
  informativo, no algo que el botón deba setear).
- Debajo, un banner amarillo no bloqueante que solo aparece cuando se detecta "sin
  personal disponible" (segundo escenario): texto explicativo, sin botón de acción (la
  acción de marcar NO_DISPONIBLE sigue siendo manual y separada).
- Deshabilitar el botón mientras la petición está en curso; mostrar el error del backend
  tal cual si el PATCH falla (ya viene en español, listo para mostrar).
