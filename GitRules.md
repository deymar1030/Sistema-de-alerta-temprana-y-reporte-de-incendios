# Git Rules

Este documento establece las reglas para el manejo de ramas, commits y Pull
Requests (PR) en el repositorio
**Sistema de alerta temprana y reporte de incendios**.
Seguir estas reglas mantiene consistencia y claridad en el historial.

Repositorio: <https://github.com/deymar1030/Sistema-de-alerta-temprana-y-reporte-de-incendios>

---

## 1️⃣ Estructura del repositorio

El repositorio es un monorepo con cuatro módulos:

| Carpeta          | Módulo        |
| ---------------- | ------------- |
| `backend/`       | API REST (Node.js + Express) |
| `base de datos/` | Modelo y scripts de PostgreSQL |
| `frontend/`      | Cliente de visualización *(por definir)* |
| `hardware/`      | Sensores y firmware *(por definir)* |

Cada rama de trabajo debe tocar **un solo módulo** siempre que sea posible.

---

## 2️⃣ Ramas base

| Rama         | Uso |
| ------------ | --- |
| `main`       | Rama principal y estable. Solo recibe merges vía PR aprobado. |
| `dev`        | Integración del trabajo en curso antes de pasar a `main`. |
| `production` | Estado desplegado en producción. |

> Si el equipo necesita separar plataformas puede usar `dev/win` y `dev/lin`;
> mientras no sea necesario, se trabaja únicamente con `dev`.

---

## 3️⃣ Naming de ramas de trabajo

Formato:

```
[tipo]/[numero-issue]-[descripcion-corta]
```

- **Tipos permitidos:**
  - `feature` → nuevas funcionalidades
  - `fix` → corrección de errores
  - `docs` → documentación
  - `refactor` → refactorización de código
  - `test` → pruebas
  - `chore` → tareas de mantenimiento

- **Número de issue:** el issue que se está trabajando.
- **Descripción corta:** palabras en minúscula separadas por guiones, sin espacios.

**Ejemplos:**

```
feature/12-endpoint-registro-reporte
fix/34-validacion-coordenadas
docs/22-actualizar-readme-backend
refactor/18-separar-capa-infraestructura
chore/7-configurar-eslint
```

---

## 4️⃣ Commits

Formato:

```
[Tipo]: breve descripción (#issue)
```

**Ejemplos:**

```
Feature: implementar caso de uso RegistrarReporteDeIncendio (#12)
Fix: corregir cálculo de nivel de riesgo (#34)
Docs: agregar sección de arquitectura al readme del backend (#22)
```

- Commits pequeños y enfocados en una sola tarea.
- Evitar mensajes genéricos como `cambios`, `arreglo` o `update`.
- Enlazar siempre con el issue correspondiente.

---

## 5️⃣ Naming de Pull Requests

Formato:

```
[Tipo]: breve descripción del cambio
```

Tipos: `Feature:`, `Fix:`, `Docs:`, `Refactor:`, `Test:`, `Chore:`.

**Ejemplos:**

```
Feature: endpoint de registro de reportes de incendio
Fix: corregir bug en el health check
Docs: actualizar README central con estado de los módulos
```

---

## 6️⃣ Contenido del Pull Request

El cuerpo del PR debe incluir:

1. **Descripción:** qué hace el PR.
2. **Motivo:** qué problema resuelve.
3. **Issue relacionado:** `Closes #<numero>`.

**Ejemplo:**

```
### Descripción
Se agregó el endpoint POST /api/reportes que registra un nuevo reporte de incendio.

### Motivo
Los usuarios necesitan poder reportar un incendio desde el cliente.

### Issue relacionado
Closes #12
```

> `Closes #12` cierra automáticamente el issue al fusionar el PR.

---

## 7️⃣ Buenas prácticas

- Actualizar la rama con `dev` (o `main`) antes de abrir el PR.
- Ejecutar el backend localmente y verificar que arranca (`npm run dev`).
- Actualizar la documentación afectada por el cambio.
- Al menos una revisión aprobada antes del merge.

---

## 8️⃣ Notas

- Las ramas de trabajo se eliminan una vez que su PR ha sido aprobado y fusionado.
- No se hace push directo a `main`, `dev` ni `production`.
