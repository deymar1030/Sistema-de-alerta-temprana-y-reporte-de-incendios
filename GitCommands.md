# GitCommands — Guía

Comandos esenciales para trabajar en el repositorio
**Sistema de alerta temprana y reporte de incendios**, junto con los conceptos
clave del flujo colaborativo en GitHub.

Repositorio: <https://github.com/deymar1030/Sistema-de-alerta-temprana-y-reporte-de-incendios>

Las reglas de nombres de ramas, commits y PR están en [`GitRules.md`](GitRules.md).

---

## Flujo para subir cambios

### 1. Clonar el repositorio

```bash
git clone https://github.com/deymar1030/Sistema-de-alerta-temprana-y-reporte-de-incendios
cd Sistema-de-alerta-temprana-y-reporte-de-incendios
```

### 2. Actualizar la rama base y crear una rama de trabajo

```bash
git checkout main
git pull origin main
git checkout -b feature/1-init-backend
```

### 3. Realizar los cambios

Avanzar en el código del módulo correspondiente (`backend/`, `base de datos/`, etc.).

### 4. Agregar los cambios al área de preparación (staging)

```bash
git add backend/src/server.js      # un archivo concreto
git add backend/                   # una carpeta
git add .                          # todo lo modificado
```

### 5. Hacer commit con un mensaje descriptivo

```bash
git commit -m "Feature: inicializar backend con Express (#1)"
```

### 6. Subir la rama al repositorio remoto

```bash
git push origin feature/1-init-backend
```

### 7. Abrir el Pull Request

Desde GitHub, crear el PR de `feature/1-init-backend` hacia `dev` (o `main`),
siguiendo el formato de [`GitRules.md`](GitRules.md).

### 8. Mantener la rama actualizada

```bash
git pull origin main --rebase
```

---

## Trabajar solo con carpetas específicas (sparse-checkout)

Útil si solo necesitas un módulo del monorepo (por ejemplo, solo `backend/`).

```bash
git clone --no-checkout https://github.com/deymar1030/Sistema-de-alerta-temprana-y-reporte-de-incendios
cd Sistema-de-alerta-temprana-y-reporte-de-incendios
git sparse-checkout init --cone
git sparse-checkout set backend
git checkout main
```

Agregar otra carpeta:

```bash
git sparse-checkout add "base de datos"
```

Redefinir el conjunto de carpetas:

```bash
git sparse-checkout set backend frontend
```

Volver al checkout completo:

```bash
git sparse-checkout disable
```

---

## Conceptos clave de Git y GitHub

### Projects

Tablero estilo kanban en GitHub para organizar tareas: hace visible lo pendiente,
lo que está en progreso y lo completado.

### Issues

Tareas, errores o mejoras identificadas. Describen qué se debe hacer, por qué y
quién es responsable. Las ramas y commits se enlazan con su issue.

### Commits

Registran cambios con un mensaje descriptivo, permitiendo un historial ordenado
y revertir errores.

### Push

Envía los commits locales al repositorio remoto para que el equipo los vea.

### Pull Request (PR)

Solicitud formal para integrar los cambios de una rama en otra. Permite revisar,
discutir y validar el código antes de fusionarlo.
