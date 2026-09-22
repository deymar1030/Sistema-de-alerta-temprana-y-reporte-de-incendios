# Base de datos

PostgreSQL como almacén relacional del sistema. Este documento cubre el
esquema, cómo levantarlo con Docker, y el trabajo en curso en la rama
`escenariomercado`: un escenario simulado de mercado para generar datos de
sensores sin depender de hardware real.

---

## Contexto: por qué un escenario simulado

El proyecto no cuenta con presupuesto para instalar sensores físicos. Como
alternativa, se está construyendo un **predio simulado** (un mercado
inventado, pero con forma y rubros inspirados en un caso real) que genera
lecturas de sensores realistas y las persiste en esta misma base de datos,
como si vinieran de hardware. El motivo directo es el incendio de la **Feria
Barrio Lindo** (Santa Cruz de la Sierra, agosto de 2026), que afectó a miles
de comerciantes.

El predio se basa en el plano de Planta Baja del Centro Comercial Barrio
Lindo (forma del lote, distribución de puestos), mezclando en cada puesto
distintos rubros (ropa y telas, muebles, ferretería, pirotecnia,
electrodomésticos, cueros y zapatos, bisutería y celulares, comida) en vez
de zonificar en bloques puros — así se parece más a un mercado real.

---

## Cómo levantar la base de datos

Desde la raíz del repositorio, con Docker Desktop abierto:

```powershell
docker compose up -d
```

Esto crea un contenedor `incendios_db` (Postgres 16) con un volumen
persistente, y aplica `bd/bd.sql` automáticamente la primera vez que se
crea (vía `docker-entrypoint-initdb.d`). Si el esquema cambia después,
`bd.sql` no se vuelve a ejecutar solo — hay que aplicarlo a mano o recrear
el volumen.

Verificar que las tablas quedaron creadas:

```powershell
docker exec incendios_db psql -U postgres -d incendios -c "\dt"
```

Las credenciales por defecto (usuario `postgres`, contraseña `postgres`,
base `incendios`) están en `backend/.env.example` — copiar a `backend/.env`
para que el backend y los scripts de simulación puedan conectarse.

---

## Esquema

### Tablas originales (18)

Cubren la operación real del sistema: zonas geográficas, tipos de entorno,
ubicaciones, sensores, motor de detección, auditoría de lecturas firmadas,
alertas, usuarios/roles/instituciones, políticas y reportes ciudadanos. Ver
`bd.sql` para el detalle completo de columnas y relaciones.

### Tablas agregadas para el escenario simulado (3)

| Tabla | Propósito |
|---|---|
| `celda` | Grilla de simulación del predio (mercado). Cada fila es una celda con su tipo de entorno (rubro/material). No representa necesariamente un punto con sensor — es el "mundo interno" del motor de fuego. |
| `ejecucion_simulacion` | Una corrida del incendio simulado: semilla, celda de ignición, parámetros. Permite repetir y comparar simulaciones. |
| `estado_celda` | Estado real del fuego (intacta/ardiendo/quemada) por celda y por paso — la "verdad de terreno", separada del ruido de las lecturas de sensores. Es el insumo para una futura animación/visualización. |

### Relaciones que faltaban y se agregaron

| FK nueva | Por qué |
|---|---|
| `sensor.id_ubic_geo → ubicacion_geografica` | Antes no existía forma de saber dónde está instalado un sensor. |
| `ubicacion_geografica.id_tipo_entorno → tipo_entorno` | Permite que un punto puntual sepa a qué rubro/material pertenece, no solo la zona completa. |
| `ubicacion_geografica.id_celda → celda` | Vincula un punto de sensor con la celda de la grilla de simulación que observa. |

Nada de lo anterior modifica ni elimina columnas o relaciones existentes —
son agregados puros.

---

## Datos de siembra del predio simulado

El script `backend/simulacion/seed-predio.js` puebla el predio una sola vez
(no se repite en cada simulación de incendio):

```powershell
cd backend
npm install
npm run seed:predio
```

Genera:

- 1 fila en `zona_geografica` (el mercado).
- 9 filas en `tipo_entorno` (8 rubros + pasillo/circulación).
- 210 filas en `celda`: una grilla de 10×21 con dos alas de puestos y una
  isla central separadas por pasillos, con el rubro de cada celda sorteado
  según una distribución de pesos (mezclado, no zonificado en bloques).
- 8 puntos de sensor (`ubicacion_geografica` + 2 filas de `sensor` cada uno:
  temperatura y humo), concentrados sobre todo en la isla central.

---

## Estado actual (rama `escenariomercado`)

- ✅ Esquema ampliado y aplicado vía Docker.
- ✅ Predio del mercado sembrado con datos de ejemplo.
- ⏳ Motor de propagación de fuego (headless, sin visualización) — pendiente.
- ⏳ Generador de lecturas de sensores con ruido, a partir del estado del
  fuego — pendiente.
- ⏳ Integración con un endpoint real del backend (hoy los scripts se
  conectan directo a Postgres; el backend todavía no tiene rutas de
  ingesta de sensores).
- 🔜 Animación/visualización del incendio — deliberadamente aparte, se
  aborda después de tener los datos funcionando.

---

## Relación con el módulo `backend/`

Los scripts de simulación viven en `backend/simulacion/` porque comparten
lenguaje (Node.js) y configuración de conexión con el backend, pero no son
parte de la API todavía — se conectan directo a Postgres con `pg`. El día
que el backend tenga su propio endpoint de ingesta de lecturas, estos
scripts pasan a llamarlo por HTTP en vez de insertar directo, sin cambiar
la lógica del motor ni del generador.
