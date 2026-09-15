-- ============================================================
-- MODELO RELACIONAL
-- SISTEMA DE ALERTA TEMPRANA Y REPORTE DE INCENDIOS
-- PostgreSQL
-- Sincronizado 1:1 con backend/prisma/schema.prisma
-- ============================================================


-- ============================================================
-- ENTIDADES
-- ============================================================


-- ------------------------------------------------------------
-- ZONA_GEOGRAFICA
-- ------------------------------------------------------------

CREATE TABLE ZONA_GEOGRAFICA (
    id_zona              SERIAL PRIMARY KEY,
    nombre               VARCHAR(150),
    departamento         VARCHAR(100),
    municipio            VARCHAR(100),
    descripcion          TEXT,
    estado               VARCHAR(50),
    densidad_poblacional NUMERIC
);


-- ------------------------------------------------------------
-- INSTITUCION
-- ------------------------------------------------------------

CREATE TABLE INSTITUCION (
    id_institucion SERIAL PRIMARY KEY,
    categoria      VARCHAR(100),
    detalle        TEXT,
    nombre         VARCHAR(150),
    razon_social   VARCHAR(150),
    telefono_ins   VARCHAR(30)
);


-- ------------------------------------------------------------
-- ROL
-- ------------------------------------------------------------

CREATE TABLE ROL (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(100)
);


-- ------------------------------------------------------------
-- MOTOR_DET
-- ------------------------------------------------------------

CREATE TABLE MOTOR_DET (
    id_motordet          SERIAL PRIMARY KEY,
    fecha_actualizacion  TIMESTAMP,
    tipo_analisis        VARCHAR(100),
    rango_min            NUMERIC,
    rango_max            NUMERIC,
    porcentaje_riesgo    NUMERIC,
    nombre               VARCHAR(150),
    version              VARCHAR(50),
    estado               VARCHAR(50),
    nivel_sensibilidad   VARCHAR(50)
);


-- ------------------------------------------------------------
-- POLITICA
-- ------------------------------------------------------------

CREATE TABLE POLITICA (
    id_politica     SERIAL PRIMARY KEY,
    intentos        INTEGER,
    bloqueo         INTEGER,
    tiempo          TIMESTAMP,
    ip_origen       INET,
    modo_emergencia BOOLEAN,
    horario_inicio  TIME,
    horario_fin     TIME,
    ip_bloqueado    INET,
    mfa             BOOLEAN
);


-- ------------------------------------------------------------
-- TIPO_ENTORNO
-- ------------------------------------------------------------

CREATE TABLE TIPO_ENTORNO (
    id_tipo_entorno       SERIAL PRIMARY KEY,
    id_zona               INTEGER,
    clasificacion         VARCHAR(100),
    descripcion           TEXT,
    material_predominante VARCHAR(150),
    nivel_riesgo_base     NUMERIC,

    CONSTRAINT fk_tipo_entorno_zona
        FOREIGN KEY (id_zona)
        REFERENCES ZONA_GEOGRAFICA(id_zona)
);


-- ------------------------------------------------------------
-- UBICACION_GEOGRAFICA
-- ------------------------------------------------------------

CREATE TABLE UBICACION_GEOGRAFICA (
    id_ubic_geo         SERIAL PRIMARY KEY,
    id_zona             INTEGER,
    id_motordet         INTEGER,
    latitud             NUMERIC(10,7),
    longitud            NUMERIC(10,7),
    altitud             NUMERIC,
    poligono_geografico JSONB,

    CONSTRAINT fk_ubicacion_zona
        FOREIGN KEY (id_zona)
        REFERENCES ZONA_GEOGRAFICA(id_zona),

    CONSTRAINT fk_ubicacion_motor
        FOREIGN KEY (id_motordet)
        REFERENCES MOTOR_DET(id_motordet)
);


-- ------------------------------------------------------------
-- PREDIO (NUEVO)
-- ------------------------------------------------------------

CREATE TABLE PREDIO (
    id_predio   SERIAL PRIMARY KEY,
    id_ubic_geo INTEGER,
    nombre      VARCHAR(150),
    direccion   VARCHAR(255),

    CONSTRAINT fk_predio_ubicacion
        FOREIGN KEY (id_ubic_geo)
        REFERENCES UBICACION_GEOGRAFICA(id_ubic_geo)
);


-- ------------------------------------------------------------
-- USUARIO
-- ------------------------------------------------------------

CREATE TABLE USUARIO (
    id_usuario       SERIAL PRIMARY KEY,
    id_rol           INTEGER,
    id_institucion   INTEGER,
    nombre           VARCHAR(150),
    telefono         VARCHAR(30),
    multiF_S         BOOLEAN,
    multiF_A         BOOLEAN,
    contrasena       VARCHAR(255),
    correo           VARCHAR(150),
    primer_apellido  VARCHAR(100),
    segundo_apellido VARCHAR(100),

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES ROL(id_rol),

    CONSTRAINT fk_usuario_institucion
        FOREIGN KEY (id_institucion)
        REFERENCES INSTITUCION(id_institucion)
);


-- ------------------------------------------------------------
-- SESION (NUEVO)
-- ------------------------------------------------------------

CREATE TABLE SESION (
    id_sesion     SERIAL PRIMARY KEY,
    id_usuario    INTEGER,
    refresh_token TEXT,
    dispositivo   VARCHAR(150),

    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario)
);


-- ------------------------------------------------------------
-- SENSOR
-- ------------------------------------------------------------

CREATE TABLE SENSOR (
    id_sensor         SERIAL PRIMARY KEY,
    id_ubic_geo       INTEGER,
    id_predio         INTEGER,
    fecha_instalacion DATE,
    estado            VARCHAR(50),
    tipo_sensor       VARCHAR(100),
    unidad_medida     VARCHAR(50),
    nombre            VARCHAR(150),
    modelo            VARCHAR(100),
    fabricante        VARCHAR(150),

    CONSTRAINT fk_sensor_ubicacion
        FOREIGN KEY (id_ubic_geo)
        REFERENCES UBICACION_GEOGRAFICA(id_ubic_geo),

    CONSTRAINT fk_sensor_predio
        FOREIGN KEY (id_predio)
        REFERENCES PREDIO(id_predio)
);


-- ------------------------------------------------------------
-- ALERTA
-- ------------------------------------------------------------

CREATE TABLE ALERTA (
    id_alerta       SERIAL PRIMARY KEY,
    fecha           DATE,
    hora            TIME,
    estado          VARCHAR(100),
    tipo_superficie VARCHAR(100),
    nivel_riesgo    VARCHAR(100)
);


-- ------------------------------------------------------------
-- LECTURA
-- ------------------------------------------------------------

CREATE TABLE LECTURA (
    id_lectura     SERIAL PRIMARY KEY,
    id_sensor      INTEGER,
    id_alerta      INTEGER,
    id_motordet    INTEGER,
    valor          NUMERIC,
    fecha_hora     TIMESTAMP,
    estado_lectura VARCHAR(100),
    tipo_variable  VARCHAR(100),

    CONSTRAINT fk_lectura_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES SENSOR(id_sensor),

    CONSTRAINT fk_lectura_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES ALERTA(id_alerta),

    CONSTRAINT fk_lectura_motordet
        FOREIGN KEY (id_motordet)
        REFERENCES MOTOR_DET(id_motordet)
);


-- ------------------------------------------------------------
-- AUDITORIA
-- ------------------------------------------------------------

CREATE TABLE AUDITORIA (
    id_auditoria   SERIAL PRIMARY KEY,
    id_usuario     INTEGER,
    valor          NUMERIC,
    firma_recibida TEXT,
    firma_valida   BOOLEAN,
    tiempo         TIMESTAMP,
    id_sensor      INTEGER,
    -- Nombre tal cual aparece en el PDF; su proposito no esta documentado
    -- (revisar con el grupo de seguridad antes de usarlo).
    id_long        INTEGER,
    hp             TEXT,
    ha             TEXT,

    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_auditoria_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES SENSOR(id_sensor)
);


-- ------------------------------------------------------------
-- AUDITORIAU
-- ------------------------------------------------------------

CREATE TABLE AUDITORIAU (
    id_auditoriau SERIAL PRIMARY KEY,
    id_usuario    INTEGER,
    ip_origen     INET,
    accion        VARCHAR(100),
    detalle       JSONB,
    tiempo        TIMESTAMP,
    hash_previo   TEXT,
    hash_actual   TEXT,

    CONSTRAINT fk_auditoriau_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario)
);


-- ------------------------------------------------------------
-- REPORTE_U
-- ------------------------------------------------------------

CREATE TABLE REPORTE_U (
    id_reporteu     SERIAL PRIMARY KEY,
    id_usuario      INTEGER,
    id_ubic_geo     INTEGER,
    descripcion     TEXT,
    tipo            VARCHAR(100),
    nivel_prioridad VARCHAR(50),
    fecha_envio     TIMESTAMP,
    hp              TEXT,
    ha              TEXT,

    CONSTRAINT fk_reporteu_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_reporteu_ubicacion
        FOREIGN KEY (id_ubic_geo)
        REFERENCES UBICACION_GEOGRAFICA(id_ubic_geo)
);


-- ============================================================
-- RELACIONES N:M
-- ============================================================

-- Se elimina la relacion de "realiza" (ROL <-> AUDITORIAU): la auditoria de
-- usuario ahora se asocia directamente a USUARIO.id_usuario.


-- ------------------------------------------------------------
-- REALIZA_AUDI
-- ------------------------------------------------------------

CREATE TABLE realiza_audi (
    id_auditoria INTEGER,
    id_alerta    INTEGER,

    PRIMARY KEY (id_auditoria, id_alerta),

    CONSTRAINT fk_realiza_audi_auditoria
        FOREIGN KEY (id_auditoria)
        REFERENCES AUDITORIA(id_auditoria),

    CONSTRAINT fk_realiza_audi_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES ALERTA(id_alerta)
);


-- ------------------------------------------------------------
-- RECEPCIONA
-- ------------------------------------------------------------

CREATE TABLE recepciona (
    id_usuario INTEGER,
    id_alerta  INTEGER,

    PRIMARY KEY (id_usuario, id_alerta),

    CONSTRAINT fk_recepciona_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_recepciona_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES ALERTA(id_alerta)
);


-- ------------------------------------------------------------
-- ROL_POLITICA
-- ------------------------------------------------------------

CREATE TABLE rol_politica (
    id_rol      INTEGER,
    id_politica INTEGER,

    PRIMARY KEY (id_rol, id_politica),

    CONSTRAINT fk_rol_politica_rol
        FOREIGN KEY (id_rol)
        REFERENCES ROL(id_rol),

    CONSTRAINT fk_rol_politica_politica
        FOREIGN KEY (id_politica)
        REFERENCES POLITICA(id_politica)
);


-- ------------------------------------------------------------
-- GENERARU
-- ------------------------------------------------------------

CREATE TABLE generaRU (
    id_alerta    INTEGER,
    id_reporte_u INTEGER,

    PRIMARY KEY (id_alerta, id_reporte_u),

    CONSTRAINT fk_generaru_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES ALERTA(id_alerta),

    CONSTRAINT fk_generaru_reporte
        FOREIGN KEY (id_reporte_u)
        REFERENCES REPORTE_U(id_reporteu)
);


-- ------------------------------------------------------------
-- ENVIA
-- ------------------------------------------------------------

CREATE TABLE envia (
    id_alerta      INTEGER,
    id_institucion INTEGER,

    PRIMARY KEY (id_alerta, id_institucion),

    CONSTRAINT fk_envia_alerta
        FOREIGN KEY (id_alerta)
        REFERENCES ALERTA(id_alerta),

    CONSTRAINT fk_envia_institucion
        FOREIGN KEY (id_institucion)
        REFERENCES INSTITUCION(id_institucion)
);


-- ------------------------------------------------------------
-- CUBRE_JURISDICCION
-- ------------------------------------------------------------

CREATE TABLE cubre_jurisdiccion (
    id_zona        INTEGER,
    id_institucion INTEGER,

    PRIMARY KEY (id_zona, id_institucion),

    CONSTRAINT fk_cubre_jurisdiccion_zona
        FOREIGN KEY (id_zona)
        REFERENCES ZONA_GEOGRAFICA(id_zona),

    CONSTRAINT fk_cubre_jurisdiccion_institucion
        FOREIGN KEY (id_institucion)
        REFERENCES INSTITUCION(id_institucion)
);
