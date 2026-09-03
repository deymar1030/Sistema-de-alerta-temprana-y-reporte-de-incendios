-- ============================================================
-- PostgreSQL
-- ============================================================

-- ============================================================
-- 1. ZONA GEOGRÁFICA
-- ============================================================

CREATE TABLE zona_geografica (
    id_zona BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    densidad_poblacional NUMERIC(10,2)
);

-- ============================================================
-- 2. TIPO DE ENTORNO
-- ============================================================

CREATE TABLE tipo_entorno (
    id_tipo_entorno BIGSERIAL PRIMARY KEY,
    id_zona BIGINT NOT NULL,
    clasificacion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    material_predominante VARCHAR(150),
    nivel_riesgo_base NUMERIC(5,2),

    CONSTRAINT fk_tipo_entorno_zona
        FOREIGN KEY (id_zona)
        REFERENCES zona_geografica(id_zona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- 3. MOTOR DE DETECCIÓN / ANÁLISIS
-- ============================================================

CREATE TABLE motor_det (
    id_motordet BIGSERIAL PRIMARY KEY,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_analisis VARCHAR(100) NOT NULL,
    rango_min NUMERIC(10,2),
    rango_max NUMERIC(10,2),
    porcentaje_riesgo NUMERIC(5,2),
    nombre VARCHAR(150) NOT NULL,
    version VARCHAR(50),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    nivel_sensibilidad NUMERIC(5,2)
);

-- ============================================================
-- 4. UBICACIÓN GEOGRÁFICA
-- ============================================================

CREATE TABLE ubicacion_geografica (
    id_ubic_geo BIGSERIAL PRIMARY KEY,
    id_zona BIGINT NOT NULL,
    id_motordet BIGINT,
    latitud NUMERIC(10,7) NOT NULL,
    longitud NUMERIC(10,7) NOT NULL,
    altitud NUMERIC(10,2),
    poligono_geografico TEXT,

    CONSTRAINT fk_ubicacion_zona
        FOREIGN KEY (id_zona)
        REFERENCES zona_geografica(id_zona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ubicacion_motor
        FOREIGN KEY (id_motordet)
        REFERENCES motor_det(id_motordet)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 5. SENSOR
-- ============================================================

CREATE TABLE sensor (
    id_sensor BIGSERIAL PRIMARY KEY,
    fecha_instalacion DATE,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_sensor VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    modelo VARCHAR(100),
    fabricante VARCHAR(100)
);

-- ============================================================
-- 6. INSTITUCIÓN
-- ============================================================

CREATE TABLE institucion (
    id_institucion BIGSERIAL PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    detalle TEXT,
    atributo_adicional_1 VARCHAR(255),
    atributo_adicional_2 VARCHAR(255),
    atributo_adicional_3 VARCHAR(255)
);

-- ============================================================
-- 7. ROL
-- ============================================================

CREATE TABLE rol (
    id_rol BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    nivel INTEGER,
    atributo_adicional_1 VARCHAR(255),
    atributo_adicional_2 VARCHAR(255),
    atributo_adicional_3 VARCHAR(255)
);

-- ============================================================
-- 8. USUARIO
-- ============================================================

CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL,
    id_institucion BIGINT,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    rol VARCHAR(100),
    atributo_adicional_1 VARCHAR(255),

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_usuario_institucion
        FOREIGN KEY (id_institucion)
        REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 9. POLÍTICA
-- ============================================================

CREATE TABLE politica (
    id_politica BIGSERIAL PRIMARY KEY,
    intentos INTEGER,
    bloqueo BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo INTEGER,
    id_instituto BIGINT,
    id_origen BIGINT,

    CONSTRAINT fk_politica_institucion
        FOREIGN KEY (id_instituto)
        REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 10. ROL - POLÍTICA
-- Relación N:M entre Rol y Política
-- ============================================================

CREATE TABLE rol_politica (
    id_rol_politica BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL,
    id_politica BIGINT NOT NULL,

    CONSTRAINT fk_rol_politica_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_rol_politica_politica
        FOREIGN KEY (id_politica)
        REFERENCES politica(id_politica)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_rol_politica
        UNIQUE (id_rol, id_politica)
);

-- ============================================================
-- 11. AUDITORÍA
-- ============================================================

CREATE TABLE auditoria (
    id_auditoria BIGSERIAL PRIMARY KEY,
    valor NUMERIC(15,4),
    firma_recibida TEXT,
    firma_valida BOOLEAN,
    tiempo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_sensor BIGINT,
    id_long BIGINT,

    CONSTRAINT fk_auditoria_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensor(id_sensor)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 12. ALERTA
-- ============================================================

CREATE TABLE alerta (
    id_alerta BIGSERIAL PRIMARY KEY,
    id_ubic_geo BIGINT NOT NULL,
    id_auditoria BIGINT,
    id_usuario BIGINT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(50) NOT NULL,
    tipo_superficie VARCHAR(100),
    nivel_riesgo NUMERIC(5,2),

    CONSTRAINT fk_alerta_ubicacion
        FOREIGN KEY (id_ubic_geo)
        REFERENCES ubicacion_geografica(id_ubic_geo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_alerta_auditoria
        FOREIGN KEY (id_auditoria)
        REFERENCES auditoria(id_auditoria)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_alerta_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 13. LECTURA
-- ============================================================

CREATE TABLE lectura (
    id_lectura BIGSERIAL PRIMARY KEY,
    id_sensor BIGINT NOT NULL,
    id_alerta BIGINT,
    id_motordet BIGINT,
    valor NUMERIC(15,4) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_lectura VARCHAR(50),
    tipo_variable VARCHAR(100),

    CONSTRAINT fk_lectura_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensor(id_sensor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_lectura_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_lectura_motor
        FOREIGN KEY (id_motordet)
        REFERENCES motor_det(id_motordet)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 14. AUDITORÍA DE USUARIOS
-- ============================================================

CREATE TABLE auditoriau (
    id_auditoriau BIGSERIAL PRIMARY KEY,
    id_origen BIGINT,
    id_usuarios BIGINT,
    accion VARCHAR(100) NOT NULL,
    detalle TEXT,
    tiempo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoriau_usuario
        FOREIGN KEY (id_usuarios)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- ============================================================
-- 15. REPORTE DE USUARIO
-- ============================================================

CREATE TABLE reporte_u (
    id_reporte_u BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(100),
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nivel_prioridad VARCHAR(50),

    CONSTRAINT fk_reporte_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- 16. GENERA REPORTE DE USUARIO
-- Relación ALERTA - REPORTE_U
-- ============================================================

CREATE TABLE genera_ru (
    id_genera_ru BIGSERIAL PRIMARY KEY,
    id_alerta BIGINT NOT NULL,
    id_reporte_u BIGINT NOT NULL,

    CONSTRAINT fk_genera_ru_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_genera_ru_reporte
        FOREIGN KEY (id_reporte_u)
        REFERENCES reporte_u(id_reporte_u)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_genera_ru
        UNIQUE (id_alerta, id_reporte_u)
);

-- ============================================================
-- 17. ENVÍA
-- Relación ALERTA - INSTITUCIÓN
-- ============================================================

CREATE TABLE envia (
    id_envia BIGSERIAL PRIMARY KEY,
    id_alerta BIGINT NOT NULL,
    id_institucion BIGINT NOT NULL,

    CONSTRAINT fk_envia_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_envia_institucion
        FOREIGN KEY (id_institucion)
        REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_envia
        UNIQUE (id_alerta, id_institucion)
);

-- ============================================================
-- 18. CUBRE JURISDICCIÓN
-- Relación ZONA - INSTITUCIÓN
-- ============================================================

CREATE TABLE cubre_jurisdiccion (
    id_jurisdiccion BIGSERIAL PRIMARY KEY,
    id_zona BIGINT NOT NULL,
    id_institucion BIGINT NOT NULL,

    CONSTRAINT fk_jurisdiccion_zona
        FOREIGN KEY (id_zona)
        REFERENCES zona_geografica(id_zona)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_jurisdiccion_institucion
        FOREIGN KEY (id_institucion)
        REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_cubre_jurisdiccion
        UNIQUE (id_zona, id_institucion)
);

-- ============================================================
-- ÍNDICES RECOMENDADOS PARA FK
-- ============================================================

CREATE INDEX idx_tipo_entorno_zona
    ON tipo_entorno(id_zona);

CREATE INDEX idx_ubicacion_zona
    ON ubicacion_geografica(id_zona);

CREATE INDEX idx_ubicacion_motor
    ON ubicacion_geografica(id_motordet);

CREATE INDEX idx_usuario_rol
    ON usuario(id_rol);

CREATE INDEX idx_usuario_institucion
    ON usuario(id_institucion);

CREATE INDEX idx_rol_politica_rol
    ON rol_politica(id_rol);

CREATE INDEX idx_rol_politica_politica
    ON rol_politica(id_politica);

CREATE INDEX idx_lectura_sensor
    ON lectura(id_sensor);

CREATE INDEX idx_lectura_alerta
    ON lectura(id_alerta);

CREATE INDEX idx_lectura_motor
    ON lectura(id_motordet);

CREATE INDEX idx_alerta_ubicacion
    ON alerta(id_ubic_geo);

CREATE INDEX idx_alerta_usuario
    ON alerta(id_usuario);

CREATE INDEX idx_alerta_fecha
    ON alerta(fecha);

CREATE INDEX idx_auditoria_sensor
    ON auditoria(id_sensor);

CREATE INDEX idx_reporte_usuario
    ON reporte_u(id_usuario);

CREATE INDEX idx_envia_alerta
    ON envia(id_alerta);

CREATE INDEX idx_envia_institucion
    ON envia(id_institucion);

CREATE INDEX idx_jurisdiccion_zona
    ON cubre_jurisdiccion(id_zona);

CREATE INDEX idx_jurisdiccion_institucion
    ON cubre_jurisdiccion(id_institucion);