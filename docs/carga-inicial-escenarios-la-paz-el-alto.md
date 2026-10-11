# Carga inicial: escenarios de incendio — La Paz y El Alto

Fecha de consulta: 2026-10-07  
Estado: **propuesta para revisión; este documento no inserta datos en la base**.

## Objetivo y criterio

Se propone una carga piloto con instituciones reales y escenarios de incendio
simulados. Las instituciones conservan sus coordenadas públicas reales. Los
predios son puntos ficticios de simulación, próximos a cada sector, y no deben
interpretarse como reportes de incidentes reales.

La fuente geográfica es OpenStreetMap, consultada mediante Nominatim. Al mostrar
o redistribuir estos datos debe incluirse la atribución `© OpenStreetMap
contributors` y la referencia a la licencia ODbL:
<https://www.openstreetmap.org/copyright>.

## Reglas de carga

- Crear primero las zonas, luego las instituciones y finalmente sus vínculos de
  jurisdicción.
- Los identificadores `id_zona`, `id_institucion`, `id_predio` e `id_alerta` los
  genera la base. No se deben fijar manualmente.
- `densidad_poblacional`, teléfonos y razón social quedan como `NULL` hasta
  validarlos con una fuente oficial.
- La API actual solamente admite las categorías `BOMBEROS`, `POLICIA`,
  `DEFENSA_CIVIL`, `RESCATE` y `OTRA`. Por ello, los hospitales se cargarán con
  `categoria = OTRA` y se identificarán como hospital en `detalle`.
- El sistema no guarda polígonos para `zona_geografica`; el alcance se describe
  textualmente. La ubicación exacta está en `institucion` y `predio`.

## 1. Registros de `zona_geografica`

| Clave de referencia | nombre | departamento | municipio | descripcion | estado | densidad_poblacional |
|---|---|---|---|---|---|---|
| Z-LP-CENTRO | La Paz - Centro | La Paz | La Paz | Sector operativo Centro y Miraflores; incluye incidentes de simulación cercanos a Av. Bautista Saavedra y Casco Viejo. | true | NULL |
| Z-LP-NORTE | La Paz - Norte | La Paz | La Paz | Sector operativo La Portada, Villa Pabón y Periférica. | true | NULL |
| Z-EA-CENTRO | El Alto - Centro | La Paz | El Alto | Sector operativo Distrito 1 y entorno de la Av. Panorámica. | true | NULL |
| Z-EA-NORTE | El Alto - Norte | La Paz | El Alto | Sector operativo Distrito 5, Zona Brasil y Av. Juan Pablo II. | true | NULL |

## 2. Registros reales de `institucion`

Las coordenadas se redondean a seis decimales, la precisión definida por el
esquema. `estado` se crea en `true` por defecto; `disponibilidad_operativa` queda
en `NULL` hasta que la institución la confirme.

| Ref. | categoria | nombre | detalle | direccion | latitud | longitud | Fuente OSM |
|---|---|---|---|---|---:|---:|---|
| I-LP-BOM-01 | BOMBEROS | Estación de Bomberos: Antofagasta | Estación de bomberos; institución principal de respuesta para las zonas La Paz. | Calle Mariscal Antonio José de Sucre, Casco Viejo, Miraflores, La Paz | -16.496478 | -68.128744 | [way/377383574](https://www.openstreetmap.org/way/377383574) |
| I-LP-POL-01 | POLICIA | Fuerza Especial de Lucha Contra el Crimen (FELCC) | Punto policial de referencia para coordinación y perímetro en La Paz. | Calle Bolívar, Villa Pabón, Periférica, La Paz | -16.493802 | -68.132244 | [way/756022057](https://www.openstreetmap.org/way/756022057) |
| I-LP-HOS-01 | OTRA | Hospital de Clínicas | Hospital; categoría técnica `OTRA` por la restricción actual de la API. | Avenida Bautista Saavedra, Centro, La Paz | -16.507034 | -68.118605 | [way/529820510](https://www.openstreetmap.org/way/529820510) |
| I-LP-HOS-02 | OTRA | Hospital del Niño Ovidio Aligia Uría | Hospital pediátrico; categoría técnica `OTRA` por la restricción actual de la API. | Avenida Bautista Saavedra, Centro, La Paz | -16.508093 | -68.117979 | [node/7105898385](https://www.openstreetmap.org/node/7105898385) |
| I-LP-HOS-03 | OTRA | Hospital Municipal La Portada | Hospital; categoría técnica `OTRA` por la restricción actual de la API. | Avenida Florida, La Portada, La Paz | -16.489247 | -68.165578 | [way/476159039](https://www.openstreetmap.org/way/476159039) |
| I-EA-BOM-01 | BOMBEROS | Bomberos SAR Bolivia | Punto de bomberos/rescate de referencia para la simulación en El Alto. | Avenida Panorámica, Plan 561, Distrito 1, El Alto | -16.521613 | -68.148526 | [node/10894817750](https://www.openstreetmap.org/node/10894817750) |
| I-EA-POL-01 | POLICIA | Estación Policial Integral | Punto policial de referencia para coordinación y perímetro en El Alto. | Avenida Buenos Aires, Alto Chijini, Distrito 12, El Alto | -16.554044 | -68.226192 | [way/526830954](https://www.openstreetmap.org/way/526830954) |
| I-EA-HOS-01 | OTRA | Hospital Boliviano Holandés | Hospital; categoría técnica `OTRA` por la restricción actual de la API. | Distrito 1, El Alto | -16.522299 | -68.153673 | [way/462867663](https://www.openstreetmap.org/way/462867663) |
| I-EA-HOS-02 | OTRA | Hospital Del Norte | Hospital; categoría técnica `OTRA` por la restricción actual de la API. | Avenida Juan Pablo II, Zona Brasil, Distrito 5, El Alto | -16.489499 | -68.204343 | [way/657041343](https://www.openstreetmap.org/way/657041343) |

Para cada institución de la tabla: `razon_social = NULL`, `telefono_ins = NULL`,
`estado = true` y `disponibilidad_operativa = NULL`.

## 3. Registros de `cubre_jurisdiccion`

Usar los ID generados al insertar las claves de referencia indicadas.

| Zona | Institución | Rol operativo esperado |
|---|---|---|
| Z-LP-CENTRO | I-LP-BOM-01 | Respuesta primaria al incendio |
| Z-LP-CENTRO | I-LP-POL-01 | Perímetro, tránsito y coordinación |
| Z-LP-CENTRO | I-LP-HOS-01 | Atención médica general |
| Z-LP-CENTRO | I-LP-HOS-02 | Atención pediátrica / apoyo médico |
| Z-LP-NORTE | I-LP-BOM-01 | Respuesta primaria al incendio |
| Z-LP-NORTE | I-LP-POL-01 | Perímetro y coordinación |
| Z-LP-NORTE | I-LP-HOS-03 | Atención médica de referencia |
| Z-EA-CENTRO | I-EA-BOM-01 | Respuesta primaria al incendio |
| Z-EA-CENTRO | I-EA-POL-01 | Perímetro y coordinación |
| Z-EA-CENTRO | I-EA-HOS-01 | Atención médica de referencia |
| Z-EA-NORTE | I-EA-BOM-01 | Respuesta primaria al incendio |
| Z-EA-NORTE | I-EA-POL-01 | Perímetro y coordinación |
| Z-EA-NORTE | I-EA-HOS-02 | Atención médica de referencia |

## 4. Predios para los escenarios (`predio`)

Estos cuatro registros son **simulados**. Sus coordenadas son puntos de prueba,
no direcciones declaradas de inmuebles reales. Antes de insertarlos se debe
seleccionar un `id_motordet` existente que tenga parámetros para las lecturas de
temperatura, humo o gas.

| Ref. | Zona | tipo_predio | nombre | direccion | latitud | longitud | fecha_evaluacion | Factores de riesgo propuestos |
|---|---|---|---|---|---:|---:|---|---|
| P-LP-01 | Z-LP-CENTRO | EDIFICIO | Escenario Centro 01 | Punto simulado, sector Centro/Miraflores, La Paz | -16.503500 | -68.122000 | 2026-10-07 | estado_electrico=3; estado_gas=2; fuentes_calor=2; carga_combustible=2; material_construccion=2; ocupacion=3; nivel_proteccion=2 |
| P-LP-02 | Z-LP-NORTE | MERCADO | Escenario Norte 01 | Punto simulado, sector La Portada/Periférica, La Paz | -16.490800 | -68.157000 | 2026-10-07 | estado_electrico=3; estado_gas=3; fuentes_calor=3; carga_combustible=4; material_construccion=2; ocupacion=4; nivel_proteccion=2 |
| P-EA-01 | Z-EA-CENTRO | VIVIENDA | Escenario El Alto Centro 01 | Punto simulado, Distrito 1, El Alto | -16.524000 | -68.151500 | 2026-10-07 | estado_electrico=2; estado_gas=2; fuentes_calor=2; carga_combustible=2; material_construccion=2; ocupacion=3; nivel_proteccion=2 |
| P-EA-02 | Z-EA-NORTE | EDIFICIO | Escenario El Alto Norte 01 | Punto simulado, Zona Brasil/Distrito 5, El Alto | -16.491500 | -68.201500 | 2026-10-07 | estado_electrico=3; estado_gas=2; fuentes_calor=3; carga_combustible=3; material_construccion=2; ocupacion=3; nivel_proteccion=2 |

Para cada predio faltan dos valores dependientes de datos ya existentes:
`id_zona` (se obtiene con la clave de la sección 1) e `id_motordet` (motor de
detección vigente). El campo `irp` debe ser calculado por el motor; no conviene
asignarlo manualmente.

## 5. Datos de simulación posteriores

No deben cargarse hasta conocer el `id_sensor` creado y los umbrales del motor.
Para cada predio se requieren, en este orden:

1. Un `sensor` por variable usada: por ejemplo `TEMPERATURA`, `HUMO` y/o `GAS`.
   Deben definirse `rango_min`, `rango_max`, `unidad_medida`, fabricante y
   modelo según el sensor elegido.
2. Tres `lectura` por escenario: normal, advertencia y crítica. Cada lectura
   debe tener `id_sensor`, `valor`, `fecha_hora`, `estado_lectura` y
   `tipo_variable` acordes a los parámetros del motor.
3. Una `alerta` originada por la lectura crítica y los registros `envia` hacia
   bomberos, policía y hospital vinculados a la zona.
4. Opcionalmente, un `informe_atencion` cuando exista un usuario real asociado a
   la institución que atendió la alerta.

## Validación antes de cargar

- Confirmar que las instituciones continúan operativas y que su ubicación es
  correcta; OpenStreetMap es colaborativo y puede cambiar.
- Confirmar con el equipo cuál `motor_det` usar y la escala válida (1–4 es solo
  una propuesta de escenario, no una restricción comprobada del motor).
- Revisar que las rutas de OSMnx se calculen hacia las coordenadas de las
  instituciones, no hacia el nombre de la zona.
- La relación `cubre_jurisdiccion` modela la cobertura, pero el flujo actual de
  alertas debe verificarse para confirmar que cree automáticamente los envíos
  (`envia`) a partir de ella.

## 6. Código SQL de carga (no ejecutado)

> **Importante:** este código es una plantilla y **no fue ejecutado**. Haz una
> copia de la base de desarrollo antes de usarlo. La fuente de verdad del
> proyecto es `backend/prisma/schema.prisma`: el archivo histórico `bd/bd.sql`
> no refleja todas las columnas actuales de Prisma, entre ellas las coordenadas
> de `institucion`.

El siguiente bloque crea las zonas, instituciones y relaciones de cobertura. Es
idempotente para estos datos: si encuentra una zona o institución con el mismo
nombre y municipio/dirección, no vuelve a crearla. Se usa `ON CONFLICT DO
NOTHING` para evitar repetir las relaciones.

```sql
BEGIN;

-- 1) Zonas operativas
INSERT INTO zona_geografica
  (nombre, departamento, municipio, descripcion, estado, densidad_poblacional)
SELECT v.nombre, 'La Paz', v.municipio, v.descripcion, TRUE, NULL
FROM (VALUES
  ('La Paz - Centro', 'La Paz',
   'Sector operativo Centro y Miraflores; Av. Bautista Saavedra y Casco Viejo.'),
  ('La Paz - Norte', 'La Paz',
   'Sector operativo La Portada, Villa Pabón y Periférica.'),
  ('El Alto - Centro', 'El Alto',
   'Sector operativo Distrito 1 y entorno de la Av. Panorámica.'),
  ('El Alto - Norte', 'El Alto',
   'Sector operativo Distrito 5, Zona Brasil y Av. Juan Pablo II.')
) AS v(nombre, municipio, descripcion)
WHERE NOT EXISTS (
  SELECT 1 FROM zona_geografica z
  WHERE z.nombre = v.nombre AND z.municipio = v.municipio
);

-- 2) Instituciones reales georreferenciadas
INSERT INTO institucion
  (categoria, nombre, detalle, razon_social, direccion, telefono_ins,
   latitud, longitud, estado, disponibilidad_operativa)
SELECT v.categoria, v.nombre, v.detalle, NULL, v.direccion, NULL,
       v.latitud, v.longitud, TRUE, NULL
FROM (VALUES
  ('BOMBEROS', 'Estación de Bomberos: Antofagasta',
   'Estación de bomberos; fuente: OpenStreetMap way/377383574.',
   'Calle Mariscal Antonio José de Sucre, Casco Viejo, Miraflores, La Paz',
   -16.496478::numeric, -68.128744::numeric),
  ('POLICIA', 'Fuerza Especial de Lucha Contra el Crimen (FELCC)',
   'Punto policial de referencia; fuente: OpenStreetMap way/756022057.',
   'Calle Bolívar, Villa Pabón, Periférica, La Paz',
   -16.493802::numeric, -68.132244::numeric),
  ('OTRA', 'Hospital de Clínicas',
   'Hospital; categoría OTRA por restricción actual de la API; OSM way/529820510.',
   'Avenida Bautista Saavedra, Centro, La Paz',
   -16.507034::numeric, -68.118605::numeric),
  ('OTRA', 'Hospital del Niño Ovidio Aligia Uría',
   'Hospital pediátrico; categoría OTRA; OSM node/7105898385.',
   'Avenida Bautista Saavedra, Centro, La Paz',
   -16.508093::numeric, -68.117979::numeric),
  ('OTRA', 'Hospital Municipal La Portada',
   'Hospital; categoría OTRA; OSM way/476159039.',
   'Avenida Florida, La Portada, La Paz',
   -16.489247::numeric, -68.165578::numeric),
  ('BOMBEROS', 'Bomberos SAR Bolivia',
   'Punto de bomberos/rescate; fuente: OpenStreetMap node/10894817750.',
   'Avenida Panorámica, Plan 561, Distrito 1, El Alto',
   -16.521613::numeric, -68.148526::numeric),
  ('POLICIA', 'Estación Policial Integral',
   'Punto policial de referencia; fuente: OpenStreetMap way/526830954.',
   'Avenida Buenos Aires, Alto Chijini, Distrito 12, El Alto',
   -16.554044::numeric, -68.226192::numeric),
  ('OTRA', 'Hospital Boliviano Holandés',
   'Hospital; categoría OTRA; OSM way/462867663.',
   'Distrito 1, El Alto',
   -16.522299::numeric, -68.153673::numeric),
  ('OTRA', 'Hospital Del Norte',
   'Hospital; categoría OTRA; OSM way/657041343.',
   'Avenida Juan Pablo II, Zona Brasil, Distrito 5, El Alto',
   -16.489499::numeric, -68.204343::numeric)
) AS v(categoria, nombre, detalle, direccion, latitud, longitud)
WHERE NOT EXISTS (
  SELECT 1 FROM institucion i
  WHERE i.nombre = v.nombre AND i.direccion = v.direccion
);

-- 3) Cobertura: zona -> institución
INSERT INTO cubre_jurisdiccion (id_zona, id_institucion)
SELECT z.id_zona, i.id_institucion
FROM (VALUES
  ('La Paz - Centro', 'Estación de Bomberos: Antofagasta'),
  ('La Paz - Centro', 'Fuerza Especial de Lucha Contra el Crimen (FELCC)'),
  ('La Paz - Centro', 'Hospital de Clínicas'),
  ('La Paz - Centro', 'Hospital del Niño Ovidio Aligia Uría'),
  ('La Paz - Norte', 'Estación de Bomberos: Antofagasta'),
  ('La Paz - Norte', 'Fuerza Especial de Lucha Contra el Crimen (FELCC)'),
  ('La Paz - Norte', 'Hospital Municipal La Portada'),
  ('El Alto - Centro', 'Bomberos SAR Bolivia'),
  ('El Alto - Centro', 'Estación Policial Integral'),
  ('El Alto - Centro', 'Hospital Boliviano Holandés'),
  ('El Alto - Norte', 'Bomberos SAR Bolivia'),
  ('El Alto - Norte', 'Estación Policial Integral'),
  ('El Alto - Norte', 'Hospital Del Norte')
) AS v(nombre_zona, nombre_institucion)
JOIN zona_geografica z ON z.nombre = v.nombre_zona
JOIN institucion i ON i.nombre = v.nombre_institucion
ON CONFLICT DO NOTHING;

COMMIT;
```

## 7. SQL para predios simulados (requiere elegir el motor)

No ejecutes este bloque hasta reemplazar `:ID_MOTOR_DETECCION` por un
`id_motordet` real de la tabla `motor_det`. Este valor debe ser el mismo motor
que el equipo eligió para calcular el IRP.

```sql
-- Sustituir :ID_MOTOR_DETECCION por un entero existente, por ejemplo 1.
-- Ejecutar después del bloque de zonas e instituciones.
INSERT INTO predio (
  id_zona, id_motordet, tipo_predio, nombre, direccion, latitud, longitud,
  fecha_evaluacion, estado_electrico, estado_gas, fuentes_calor,
  carga_combustible, material_construccion, ocupacion, nivel_proteccion
)
SELECT z.id_zona, :ID_MOTOR_DETECCION, v.tipo_predio, v.nombre, v.direccion,
       v.latitud, v.longitud, DATE '2026-10-07',
       v.estado_electrico, v.estado_gas, v.fuentes_calor, v.carga_combustible,
       v.material_construccion, v.ocupacion, v.nivel_proteccion
FROM (VALUES
  ('La Paz - Centro', 'EDIFICIO', 'Escenario Centro 01',
   'Punto simulado, sector Centro/Miraflores, La Paz',
   -16.503500::numeric, -68.122000::numeric, 3, 2, 2, 2, 2, 3, 2),
  ('La Paz - Norte', 'MERCADO', 'Escenario Norte 01',
   'Punto simulado, sector La Portada/Periférica, La Paz',
   -16.490800::numeric, -68.157000::numeric, 3, 3, 3, 4, 2, 4, 2),
  ('El Alto - Centro', 'VIVIENDA', 'Escenario El Alto Centro 01',
   'Punto simulado, Distrito 1, El Alto',
   -16.524000::numeric, -68.151500::numeric, 2, 2, 2, 2, 2, 3, 2),
  ('El Alto - Norte', 'EDIFICIO', 'Escenario El Alto Norte 01',
   'Punto simulado, Zona Brasil/Distrito 5, El Alto',
   -16.491500::numeric, -68.201500::numeric, 3, 2, 3, 3, 2, 3, 2)
) AS v(nombre_zona, tipo_predio, nombre, direccion, latitud, longitud,
       estado_electrico, estado_gas, fuentes_calor, carga_combustible,
       material_construccion, ocupacion, nivel_proteccion)
JOIN zona_geografica z ON z.nombre = v.nombre_zona
WHERE NOT EXISTS (
  SELECT 1 FROM predio p
  WHERE p.nombre = v.nombre AND p.direccion = v.direccion
);
```

## 8. Alternativa recomendada: carga mediante la API

La API requiere autenticación y evita escribir directamente en producción. Usa
la URL y token reales del entorno; este ejemplo **no incluye credenciales**.

```bash
# PowerShell: definir únicamente en la sesión actual.
$apiBase = 'http://localhost:3000'       # reemplazar por la URL real del backend
$headers = @{ Authorization = 'Bearer TU_TOKEN'; 'Content-Type' = 'application/json' }

# Crear una zona (repetir para las cuatro zonas de la sección 1).
$zona = @{
  nombre = 'La Paz - Centro'
  departamento = 'La Paz'
  municipio = 'La Paz'
  descripcion = 'Sector operativo Centro y Miraflores; Av. Bautista Saavedra y Casco Viejo.'
  estado = $true
  densidad_poblacional = $null
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$apiBase/zonas-geograficas" -Headers $headers -Body $zona

# Crear una institución real (repetir con cada fila de la sección 2).
$institucion = @{
  categoria = 'BOMBEROS'
  nombre = 'Estación de Bomberos: Antofagasta'
  detalle = 'Estación de bomberos; fuente: OpenStreetMap way/377383574.'
  razon_social = $null
  direccion = 'Calle Mariscal Antonio José de Sucre, Casco Viejo, Miraflores, La Paz'
  telefono_ins = $null
  latitud = -16.496478
  longitud = -68.128744
} | ConvertTo-Json

$bomberos = Invoke-RestMethod -Method Post -Uri "$apiBase/instituciones" -Headers $headers -Body $institucion

# Vincular una zona ya creada con una institución ya creada.
# Sustituir los dos valores por IDs devueltos por la API.
$idZona = 1
$idInstitucion = $bomberos.data.id_institucion
Invoke-RestMethod -Method Post -Uri "$apiBase/instituciones/$idInstitucion/jurisdicciones" -Headers $headers -Body (@{ id_zona = $idZona } | ConvertTo-Json)
```

La creación de predios por API usa `POST /predios` y necesita, además del
`id_zona`, un `id_motordet` existente. No se debe enviar el ejemplo hasta que
el responsable del motor confirme el ID y los valores de riesgo.
