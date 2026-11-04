-- ============================================================
-- SCRIPT DE CARGA INICIAL - ENTIDAD PREDIO (REGISTROS VERÍDICOS)
-- Sistema de alerta temprana y reporte de incendios
-- ============================================================
-- 
-- Fecha de formulación: 2026-10-12
-- Fuente geográfica: OpenStreetMap (OSM) vía Nominatim / Overpass
-- Atribución: © OpenStreetMap contributors (Licencia ODbL)
--
-- Dependencias previas:
-- 1. zona_geografica (deben existir las 4 zonas operativas: La Paz Centro,
--    La Paz Norte, El Alto Centro, El Alto Norte).
-- 2. motor_det (debe existir al menos un motor de detección configurado).
--
-- Reglas de integridad y diseño:
-- - No se asignan IDs autoincrementales manualmente (id_predio lo genera PostgreSQL).
-- - El id_zona se resuelve dinámicamente mediante el nombre oficial de la zona.
-- - El id_motordet se resuelve dinámicamente seleccionando el primer motor registrado.
-- - Los tipos de predio respetan los permitidos por el backend: 'VIVIENDA', 'EDIFICIO', 'MERCADO'.
-- - Los 7 parámetros de riesgo respetan estrictamente los rangos del modelo técnico del IRP:
--     * Probabilidad (P):
--         - estado_electrico: [1..3] (1: bueno, 2: regular, 3: deficiente)
--         - estado_gas:       [0..2] (0: no tiene, 1: certificado, 2: precario/garrafas)
--         - fuentes_calor:    [0..2] (0: ninguna, 1: moderadas, 2: altas)
--     * Consecuencia (C):
--         - carga_combustible:     [1..3] (1: baja, 2: media, 3: alta)
--         - material_construccion: [1..3] (1: incombustible, 2: mixto, 3: combustible)
--         - ocupacion:             [1..3] (1: baja/unifamiliar, 2: media/oficinas, 3: alta/masiva)
--     * Protección (M):
--         - nivel_proteccion:      [0..3] (0: ninguna, 1: extintor, 2: extintor+alarma, 3: completo)
--
-- ACLARACIÓN SOBRE EL CAMPO IRP:
-- En el uso ordinario de la aplicación (vía API REST), el usuario NUNCA calcula ni
-- digita el IRP; el backend lo calcula de forma transparente al recibir los 7 parámetros.
-- En este script SQL directo se implementa la fórmula matemática normalizada dentro del
-- INSERT para que los registros nazcan con su riesgo calculado y sean inmediatamente
-- visibles en el mapa de monitoreo y alertas. Si tu equipo requiere que nazcan sin evaluar,
-- basta con reemplazar la fórmula por: NULL AS irp.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. VALIDACIÓN PREVIA DE REQUISITOS
-- ============================================================

DO $$
DECLARE
    zonas_faltantes INT;
    motores_existentes INT;
BEGIN
    SELECT 4 - COUNT(*) INTO zonas_faltantes
    FROM zona_geografica
    WHERE nombre IN (
        'La Paz - Centro',
        'La Paz - Norte',
        'El Alto - Centro',
        'El Alto - Norte'
    );

    IF zonas_faltantes > 0 THEN
        RAISE EXCEPTION 'Faltan zonas geograficas requeridas en la base de datos.';
    END IF;

    SELECT COUNT(*) INTO motores_existentes FROM motor_det;
    IF motores_existentes = 0 THEN
        RAISE NOTICE 'Aviso: No se encontraron registros en motor_det. El script asignara id_motordet = 1 por defecto.';
    END IF;
END $$;


-- ============================================================
-- 2. CARGA DE 16 PREDIOS REALES GEORREFERENCIADOS
-- ============================================================
-- Distribución: 4 predios por zona operativa, cubriendo
-- los 3 tipos de predio admitidos (MERCADO, EDIFICIO, VIVIENDA).
-- Es idempotente: no duplica registros si ya existen por nombre o dirección.
-- ============================================================

WITH motor_seleccionado AS (
    SELECT COALESCE(MIN(id_motordet), 1) AS id_motordet
    FROM motor_det
),
predios_catalogo AS (
    SELECT * FROM (VALUES
        -- ========================================================================================================
        -- ZONA 1: LA PAZ - CENTRO (Sector Centro, Casco Viejo, Miraflores)
        -- ========================================================================================================
        (
            'La Paz - Centro',
            'MERCADO',
            'Mercado Lanza',
            'Calle Evaristo Valle esq. Plaza Mayor de San Francisco, Casco Urbano Central, La Paz',
            -16.494700::numeric(8,6),
            -68.137460::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: regular, alta demanda comercial
            2, -- estado_gas: uso intensivo de garrafas GLP en puestos de comida
            2, -- fuentes_calor: cocinas comerciales continuas
            2, -- carga_combustible: abarrotes, telas, embalajes
            1, -- material_construccion: hormigón armado incombustible
            3, -- ocupacion: masiva / gran afluencia de público
            1  -- nivel_proteccion: extintores portátiles en pasillos
        ),
        (
            'La Paz - Centro',
            'EDIFICIO',
            'Edificio Hansa',
            'Calle Yanacocha N° 1004 esq. Calle Mercado / Av. Mariscal Santa Cruz, Centro, La Paz',
            -16.497020::numeric(8,6),
            -68.135740::numeric(9,6),
            DATE '2026-10-12',
            1, -- estado_electrico: tableros con disyuntores certificados
            0, -- estado_gas: sin red de gas en oficinas
            1, -- fuentes_calor: moderadas (cafeterías y microondas)
            2, -- carga_combustible: papelería, mobiliario corporativo
            1, -- material_construccion: hormigón armado, losa y vidrio
            2, -- ocupacion: oficinas corporativas y entidades comerciales
            2  -- nivel_proteccion: extintores vigentes y sistema centralizado de alarma
        ),
        (
            'La Paz - Centro',
            'MERCADO',
            'Mercado Camacho',
            'Avenida Camacho esq. Calle Bueno, Casco Urbano Central, La Paz',
            -16.500580::numeric(8,6),
            -68.131260::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: instalación renovada pero con alta exigencia
            1, -- estado_gas: red de gas natural comercial certificada
            2, -- fuentes_calor: patio de comidas de alta rotación
            2, -- carga_combustible: alimentos y depósitos mixtos
            1, -- material_construccion: hormigón armado incombustible
            3, -- ocupacion: alta afluencia peatonal
            2  -- nivel_proteccion: extintores y red de hidrantes/alarma del complejo
        ),
        (
            'La Paz - Centro',
            'VIVIENDA',
            'Inmueble Residencial Miraflores',
            'Calle Lucas Jaimes entre Av. Busch y Calle Díaz Romero, Miraflores, La Paz',
            -16.504200::numeric(8,6),
            -68.121500::numeric(9,6),
            DATE '2026-10-12',
            1, -- estado_electrico: buena, renovación reciente
            1, -- estado_gas: gas natural domiciliario YPFB
            1, -- fuentes_calor: cocinas domésticas
            1, -- carga_combustible: baja (vivienda residencial)
            1, -- material_construccion: ladrillo y losa de concreto
            2, -- ocupacion: edificio multifamiliar de 5 pisos
            1  -- nivel_proteccion: extintor en área común
        ),

        -- ========================================================================================================
        -- ZONA 2: LA PAZ - NORTE (Sector La Portada, Villa Pabón, Periférica)
        -- ========================================================================================================
        (
            'La Paz - Norte',
            'MERCADO',
            'Mercado Haití',
            'Avenida Busch esq. Calle Haití, Miraflores Norte / Periférica, La Paz',
            -16.490880::numeric(8,6),
            -68.122590::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: regular, cableado visible en sectores comunes
            2, -- estado_gas: garrafas GLP individuales
            2, -- fuentes_calor: cocinas y hornillas continuas
            2, -- carga_combustible: víveres secos, plásticos, cartón
            2, -- material_construccion: estructura de ladrillo con tinglado mixto
            3, -- ocupacion: alta afluencia barrial
            1  -- nivel_proteccion: extintores manuales
        ),
        (
            'La Paz - Norte',
            'MERCADO',
            'Mercado Central La Portada',
            'Calle Justo Germán Varela esq. Calle Yapacaní, Zona La Portada, La Paz',
            -16.486200::numeric(8,6),
            -68.163800::numeric(9,6),
            DATE '2026-10-12',
            3, -- estado_electrico: deficiente, conexiones improvisadas
            2, -- estado_gas: garrafas de gas licuado en puestos de comida
            2, -- fuentes_calor: hornillas y freidoras comerciales
            2, -- carga_combustible: verduras, cajas de madera, abarrotes
            2, -- material_construccion: mixto (tinglado con madera y calamina)
            3, -- ocupacion: mercado zonal concurrido
            1  -- nivel_proteccion: extintor básico
        ),
        (
            'La Paz - Norte',
            'VIVIENDA',
            'Inmueble Residencial La Portada',
            'Calle Justo Germán Varela N° 450, Zona La Portada, La Paz',
            -16.488500::numeric(8,6),
            -68.164200::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: regular, instalación con más de 15 años
            1, -- estado_gas: conexión certificada a gas domiciliario
            1, -- fuentes_calor: cocina doméstica
            1, -- carga_combustible: baja (vivienda habitual)
            1, -- material_construccion: ladrillo y losa de hormigón
            2, -- ocupacion: multifamiliar (3 pisos)
            1  -- nivel_proteccion: extintor en pasillo
        ),
        (
            'La Paz - Norte',
            'EDIFICIO',
            'Edificio Administrativo Subalcaldía Periférica',
            'Av. Ramiro Castillo / Av. Ramos Gavilán, Zona Periférica Norte, La Paz',
            -16.485500::numeric(8,6),
            -68.126000::numeric(9,6),
            DATE '2026-10-12',
            1, -- estado_electrico: instalación institucional con disyuntores
            0, -- estado_gas: sin gas
            1, -- fuentes_calor: moderadas (cafetería, computadoras)
            2, -- carga_combustible: archivo documental y mobiliario de oficina
            1, -- material_construccion: hormigón y mampostería
            2, -- ocupacion: atención ciudadana y oficinas
            2  -- nivel_proteccion: extintores y señalética/alarma
        ),

        -- ========================================================================================================
        -- ZONA 3: EL ALTO - CENTRO (Distrito 1, Ciudad Satélite, entorno Panorámica / Ceja)
        -- ========================================================================================================
        (
            'El Alto - Centro',
            'MERCADO',
            'Mercado Ciudad Satélite',
            'Av. del Policía entre Calles Ballivián y Sanjinés, Plan 561, Distrito 1, El Alto',
            -16.524730::numeric(8,6),
            -68.150750::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: regular, múltiples extensiones
            2, -- estado_gas: garrafas GLP en área gastronómica
            2, -- fuentes_calor: cocinas de alta demanda
            2, -- carga_combustible: abarrotes, telas, plásticos
            2, -- material_construccion: albañilería con tinglado mixto
            3, -- ocupacion: gran concurrencia comunal
            1  -- nivel_proteccion: extintores portátiles
        ),
        (
            'El Alto - Centro',
            'MERCADO',
            'Mercado 12 de Octubre',
            'Calle 2 entre Av. Jorge Carrasco y Av. Franco Valle, Distrito 1 / Ceja, El Alto',
            -16.520800::numeric(8,6),
            -68.166450::numeric(9,6),
            DATE '2026-10-12',
            3, -- estado_electrico: deficiente, alta saturación de cables
            2, -- estado_gas: garrafas sin supervisión en pasillos
            2, -- fuentes_calor: freidoras, hornillas callejeras
            3, -- carga_combustible: alta densidad de ropa, plásticos, cartón
            2, -- material_construccion: mixto (puestos metálicos y mampostería)
            3, -- ocupacion: afluencia masiva continua
            1  -- nivel_proteccion: extintores mínimos
        ),
        (
            'El Alto - Centro',
            'EDIFICIO',
            'Edificio Residencial Satélite (Cholet)',
            'Av. Alfredo Sanjinés esq. Av. Panorámica, Plan 561, Distrito 1, El Alto',
            -16.522800::numeric(8,6),
            -68.149200::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: regular (salón de eventos y viviendas)
            1, -- estado_gas: gas natural de red
            1, -- fuentes_calor: cocinas de departamentos y salón
            2, -- carga_combustible: cortinajes, mobiliario
            1, -- material_construccion: hormigón armado, ladrillo y vidrio
            2, -- ocupacion: mixto comercial y residencial
            1  -- nivel_proteccion: extintores reglamentarios
        ),
        (
            'El Alto - Centro',
            'VIVIENDA',
            'Vivienda Satélite Plan 405',
            'Calle Arturo Ballivián N° 320, Plan 405, Distrito 1, El Alto',
            -16.527100::numeric(8,6),
            -68.148200::numeric(9,6),
            DATE '2026-10-12',
            1, -- estado_electrico: bueno, disyuntor termomagnético
            1, -- estado_gas: gas domiciliario certificado
            1, -- fuentes_calor: cocina doméstica
            1, -- carga_combustible: baja
            1, -- material_construccion: ladrillo cerámico y losa
            1, -- ocupacion: vivienda unifamiliar
            1  -- nivel_proteccion: extintor vehicular/hogareño
        ),

        -- ========================================================================================================
        -- ZONA 4: EL ALTO - NORTE (Distrito 5, Zona Brasil, Av. Juan Pablo II, Río Seco)
        -- ========================================================================================================
        (
            'El Alto - Norte',
            'EDIFICIO',
            'Edificio Emblemático UPEA',
            'Av. Juan Pablo II esq. Calle Sucre, Villa Esperanza / Distrito 5, El Alto',
            -16.491700::numeric(8,6),
            -68.193600::numeric(9,6),
            DATE '2026-10-12',
            1, -- estado_electrico: instalación institucional con disyuntores
            0, -- estado_gas: sin gas
            1, -- fuentes_calor: laboratorios ofimáticos y oficinas
            2, -- carga_combustible: archivos, biblioteca, butacas
            1, -- material_construccion: hormigón armado y aluminio
            3, -- ocupacion: afluencia masiva estudiantil
            2  -- nivel_proteccion: extintores y red de detectores de humo
        ),
        (
            'El Alto - Norte',
            'MERCADO',
            'Mercado Campesino Río Seco',
            'Av. Juan Pablo II, Sector Ex-Tranca Río Seco, Distrito 5, El Alto',
            -16.477200::numeric(8,6),
            -68.204500::numeric(9,6),
            DATE '2026-10-12',
            3, -- estado_electrico: deficiente, conexiones temporales extendidas
            2, -- estado_gas: garrafas GLP sin anclaje en casetas
            2, -- fuentes_calor: cocinas comerciales al aire libre y tinglado
            3, -- carga_combustible: alta acumulación de cajonería de madera y plásticos
            2, -- material_construccion: estructura mixta precaria
            3, -- ocupacion: aglomeración masiva de comerciantes y compradores
            0  -- nivel_proteccion: sin medidas contra incendios
        ),
        (
            'El Alto - Norte',
            'EDIFICIO',
            'Edificio Comercial Los Andes (Cholet)',
            'Av. Juan Pablo II esq. Calle Brasil, Zona Brasil, Distrito 5, El Alto',
            -16.490500::numeric(8,6),
            -68.198500::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: tableros para galería comercial y viviendas
            1, -- estado_gas: red de gas natural
            1, -- fuentes_calor: cocina doméstica y locales
            2, -- carga_combustible: mercadería en tiendas de planta baja
            1, -- material_construccion: hormigón armado y ventanería
            2, -- ocupacion: mixto comercial y departamentos
            1  -- nivel_proteccion: extintores por piso
        ),
        (
            'El Alto - Norte',
            'VIVIENDA',
            'Vivienda Familiar Zona Brasil',
            'Calle Río Beni entre Av. Juan Pablo II y Calle Brasil, Zona Brasil, Distrito 5, El Alto',
            -16.488900::numeric(8,6),
            -68.203200::numeric(9,6),
            DATE '2026-10-12',
            2, -- estado_electrico: regular
            1, -- estado_gas: red domiciliaria certificada
            1, -- fuentes_calor: cocina familiar
            1, -- carga_combustible: baja
            1, -- material_construccion: ladrillo y calamina
            1, -- ocupacion: unifamiliar
            0  -- nivel_proteccion: sin medidas
        )
    ) AS t(
        nombre_zona,
        tipo_predio,
        nombre,
        direccion,
        latitud,
        longitud,
        fecha_evaluacion,
        estado_electrico,
        estado_gas,
        fuentes_calor,
        carga_combustible,
        material_construccion,
        ocupacion,
        nivel_proteccion
    )
)
INSERT INTO predio (
    id_zona,
    id_motordet,
    tipo_predio,
    nombre,
    direccion,
    latitud,
    longitud,
    fecha_evaluacion,
    irp,
    estado_electrico,
    estado_gas,
    fuentes_calor,
    carga_combustible,
    material_construccion,
    ocupacion,
    nivel_proteccion
)
SELECT
    z.id_zona,
    m.id_motordet,
    c.tipo_predio,
    c.nombre,
    c.direccion,
    c.latitud,
    c.longitud,
    c.fecha_evaluacion,
    -- ====================================================================================
    -- CÁLCULO MATEMÁTICO DEL IRP (Fórmula técnica normalizada de 3 dimensiones)
    -- n(v, min, max) = 0.1 + 0.9 * (v - min) / (max - min)
    -- P = (n_elec + n_gas + n_calor) / 3.0
    -- C = (n_carga + n_mat + n_ocup) / 3.0
    -- M = nivel_proteccion / 3.0
    -- IRP = sqrt(P * C) * (1.0 - 0.4 * M)
    -- ====================================================================================
    ROUND(
        (
            SQRT(
                (
                    (0.1 + 0.9 * (c.estado_electrico - 1.0) / 2.0) +
                    (0.1 + 0.9 * (c.estado_gas - 0.0) / 2.0) +
                    (0.1 + 0.9 * (c.fuentes_calor - 0.0) / 2.0)
                ) / 3.0
                *
                (
                    (0.1 + 0.9 * (c.carga_combustible - 1.0) / 2.0) +
                    (0.1 + 0.9 * (c.material_construccion - 1.0) / 2.0) +
                    (0.1 + 0.9 * (c.ocupacion - 1.0) / 2.0)
                ) / 3.0
            )
            *
            (1.0 - 0.4 * (c.nivel_proteccion / 3.0))
        )::numeric,
        3
    ) AS irp,
    c.estado_electrico,
    c.estado_gas,
    c.fuentes_calor,
    c.carga_combustible,
    c.material_construccion,
    c.ocupacion,
    c.nivel_proteccion
FROM predios_catalogo c
JOIN zona_geografica z ON z.nombre = c.nombre_zona
CROSS JOIN motor_seleccionado m
WHERE NOT EXISTS (
    SELECT 1
    FROM predio p
    WHERE p.nombre = c.nombre
       OR p.direccion = c.direccion
);

COMMIT;


-- ============================================================
-- 3. CONSULTA DE VERIFICACIÓN POST-CARGA
-- ============================================================
-- Lista todos los predios creados, su zona, su IRP y la
-- clasificación resultante según la escala oficial:
--   Bajo:  IRP < 0.33
--   Medio: 0.33 <= IRP <= 0.59
--   Alto:  IRP >= 0.60
-- ============================================================

SELECT
    p.id_predio,
    z.nombre AS zona_geografica,
    p.tipo_predio,
    p.nombre,
    p.latitud,
    p.longitud,
    p.irp,
    CASE
        WHEN p.irp IS NULL THEN 'NO EVALUADO'
        WHEN p.irp < 0.33 THEN 'Bajo'
        WHEN p.irp <= 0.59 THEN 'Medio'
        ELSE 'Alto'
    END AS categoria_riesgo,
    p.fecha_evaluacion
FROM predio p
INNER JOIN zona_geografica z ON z.id_zona = p.id_zona
ORDER BY z.nombre, p.irp DESC;