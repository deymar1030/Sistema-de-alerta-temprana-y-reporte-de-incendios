# Guía: cómo se implementa un endpoint en este backend

Este documento describe el patrón que ya está aplicado en el feature
**ZonaGeografica** (`backend/src/**/zonaGeografica*`), para que cualquier
endpoint nuevo se construya exactamente de la misma forma y el proyecto no
termine con tres estilos distintos de "hacer lo mismo".

Stack: **Node.js (ESM) + Express + Prisma + PostgreSQL**, con **Clean
Architecture** (ver `backend/readme.md` para el resumen conceptual de las
capas).

## 1. Capas y responsabilidades

| Capa | Carpeta | Contiene | Depende de |
| ---- | ------- | -------- | ---------- |
| **Domain** | `backend/src/domain/<feature>/` | Entidad, DTOs, mapper. Reglas puras, sin Express ni Prisma. | Nada |
| **Application** | `backend/src/application/<feature>/` | Interfaz de repositorio (contrato) + casos de uso | Domain |
| **Infrastructure** | `backend/src/infrastructure/features/<feature>/` | Implementación concreta del repositorio con Prisma | Application, Domain |
| **Interfaces** | `backend/src/interfaces/features/<feature>Roter/` | Express: controller, service, dependencies (DI), routes | Application |

Regla de dependencia: `Interfaces → Application → Domain` e
`Infrastructure → (Application, Domain)`. El dominio nunca importa nada de
afuera. La base de datos vive detrás de una interfaz de repositorio; nadie
fuera de `infrastructure` sabe que existe Prisma.

> Nota de nombres: la carpeta de rutas se llama `<feature>Roter` (no
> `Router`) porque así quedó establecido en el primer feature de ejemplo del
> repo (`interfaces/features/ejemploRoter`). Se mantiene el mismo nombre por
> consistencia, aunque sea una errata.

## 2. Convención de archivos por capa

Usando `zonaGeografica` como referencia real (todos estos archivos ya
existen y funcionan):

```
domain/zonaGeografica/
  entities/zonaGeografica.entity.js       // clase plana, un campo por columna
  dtos/createZonaGeografica.dto.js        // constructor + static validate(data)
  dtos/updateZonaGeografica.dto.js        // constructor + static validate(id, data)
  dtos/getZonaGeografica.dto.js           // static validate(id)
  dtos/deleteZonaGeografica.dto.js        // static validate(id)
  dtos/responseZonaGeografica.dto.js      // static fromEntity(entity)
  mappers/zonaGeografica.mapper.js        // toResponseDTO / toResponseDTOArray

application/zonaGeografica/
  repositories/zonaGeografica.repository.js   // clase abstracta: cada método
                                               // hace `throw new Error("Method not implemented")`
  useCases/createZonaGeografica.useCase.js
  useCases/getZonaGeografica.useCase.js
  useCases/getAllZonaGeografica.useCase.js
  useCases/updateZonaGeografica.useCase.js
  useCases/deleteZonaGeografica.useCase.js

infrastructure/features/zonaGeografica/
  repositories/zonaGeografica.repository.impl.js  // extends la interfaz de
                                                   // application, usa this.prisma.<modelo>

infrastructure/prismaConfig/
  prismaClient.js   // instancia unica de PrismaClient (adapter-pg), compartida
                     // por todos los repositorios

interfaces/features/zonaGeograficaRoter/
  services.js        // agrupa los casos de uso, expone create/getAll/getById/update/delete
  controller.js       // mapea req.body/req.params -> llama al service -> responde JSON
  dependencies.js     // Inyeccion de dependencias: prisma -> repo -> useCases -> service -> controller
  routes.js           // Router de Express, expone `static get routes()`
```

Cada capa de un caso de uso valida con el DTO correspondiente
(`Xxx.validate(...)`) antes de tocar el repositorio, y lanza `Error` con un
mensaje legible si falla — el controller atrapa esos errores y responde
`400`/`404`/`500` según corresponda (ver punto 5).

## 3. Receta paso a paso para un feature nuevo (`<Feature>`)

Ejemplo: si mañana toca `Sensor`, `Alerta`, `Institucion`, etc., repetir
exactamente estos pasos, cambiando el nombre:

1. **Prisma**: confirmar que el modelo ya existe en
   `backend/prisma/schema.prisma` (ya están los 16 + las 6 tablas N:M del
   modelo relacional). Si cambia algo, correr `npm run prisma:generate`
   (y `npm run prisma:migrate:dev` cuando haya una base real).
2. **Domain**: crear `entities/<feature>.entity.js` con un campo por columna
   Prisma del modelo.
3. **Domain**: crear los 5 DTOs (`create`, `update`, `get`, `delete`,
   `response`) — el DTO de creación/actualización valida los campos
   obligatorios; `get`/`delete` validan el id con
   `Validators.isValidId` (`backend/src/config/validators.js`).
4. **Domain**: crear el `mapper` que traduce la entidad devuelta por Prisma
   al `responseDTO`.
5. **Application**: crear la interfaz de repositorio (métodos: `create`,
   `findById`, `findAll`, `update`, `delete` — ajustar según lo que la
   entidad realmente necesite, p. ej. `findByX`).
6. **Application**: crear un caso de uso por operación. Cada uno recibe el
   repositorio por constructor, valida con el DTO, y decide sus propias
   reglas (p. ej. "no permitir update si no existe" ya está en el patrón de
   `updateZonaGeografica.useCase.js`).
7. **Infrastructure**: crear `<feature>.repository.impl.js` que extiende la
   interfaz de application e implementa cada método con
   `this.prisma.<modelo_prisma>.<create|findMany|findUnique|update|delete>`.
8. **Interfaces**: crear `services.js` (agrupa los 5 casos de uso),
   `controller.js` (5 handlers: create/list/getById/update/remove),
   `dependencies.js` (arma todo el árbol de dependencias) y `routes.js`
   (expone el `Router` de Express).
9. **Wiring final**: en `backend/src/interfaces/router.js`, importar el
   nuevo Router y montarlo:
   `router.use("/<feature-en-plural-kebab>", <Feature>Router.routes);`

## 4. Prisma: cómo se accede a los datos

- Un único cliente compartido: `infrastructure/prismaConfig/prismaClient.js`
  (usa `@prisma/adapter-pg` + `pg.Pool`, no el motor por defecto de Prisma).
- Los repositorios de `infrastructure/features/**` son los **únicos**
  archivos que importan ese cliente y llaman métodos de Prisma
  directamente. Ninguna otra capa debe hacer `import prisma from ...`.
- Los nombres de modelo/columnas en Prisma son snake_case y coinciden 1:1
  con `bd/modelo relacional.pdf` (ver `backend/prisma/schema.prisma`).

## 5. Formato de respuesta HTTP (convención fija)

```jsonc
// éxito
{ "success": true, "data": /* objeto o array via el mapper */ }

// error
{ "success": false, "error": "mensaje" }
```

Códigos usados en el patrón actual: `201` en `create`, `200` en
`list`/`getById`/`update`/`remove`, `400` en errores de validación/negocio,
`404` cuando `getById` no encuentra el recurso, `500` para errores
inesperados en `list`.

## 6. Lo que este patrón **todavía no incluye** (no asumir que existe)

- **Sin autenticación/autorización todavía.** Las rutas de
  `zonaGeograficaRoter/routes.js` están abiertas (sin `authMiddleware`)
  porque el flujo de login/roles/JWT aún no está definido por el equipo
  (ver discusión sobre `USUARIO`/`SESION`/`POLITICA` en el análisis del
  modelo relacional). Cuando se defina, se agrega ahí, no antes.
- **Sin Swagger conectado.** Existen carpetas `interfaces/docs/*` pero están
  vacías y no están enganchadas en `server.js`.
- **Sin capa de sockets/tiempo real.** No copiar el patrón de sockets de
  otro repo sin que el equipo lo pida explícitamente.

Cuando alguna de estas piezas se defina, esta guía debe actualizarse con el
paso correspondiente (por ejemplo, "paso 9.5: agregar `authMiddleware` a las
rutas que lo requieran").
