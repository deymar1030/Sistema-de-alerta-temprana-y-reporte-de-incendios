-- ======================
-- Tabla zona_geografica
-- ======================

CREATE TABLE zona_geografica (
    id_zona               BIGSERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    departamento          VARCHAR(40)  NOT NULL,
    municipio             VARCHAR(80)  NOT NULL,
    descripcion           TEXT,
    estado                BOOLEAN NOT NULL DEFAULT TRUE,
    densidad_poblacional  NUMERIC(10,2)
);

-- ======================
-- Tabla rol
-- ======================

CREATE TABLE rol (
    id_rol           BIGSERIAL PRIMARY KEY,
    nombre_rol       VARCHAR(50) NOT NULL UNIQUE,
    mfa_obligatorio  BOOLEAN NOT NULL DEFAULT FALSE
);

-- ======================
-- Tabla politica
-- ======================

CREATE TABLE politica (
    id_politica             BIGSERIAL PRIMARY KEY,
    max_intentos_fallidos   SMALLINT NOT NULL DEFAULT 5,
    tiempo_bloqueo_minutos  SMALLINT NOT NULL DEFAULT 15,
    horario_inicio          TIME,
    horario_fin             TIME,
    ip_permitida            TEXT,
    ip_bloqueado            TEXT,
    activar_emergencia      BOOLEAN NOT NULL DEFAULT FALSE,
    ver_auditoria           BOOLEAN NOT NULL DEFAULT FALSE,
    gestionar_usuarios      BOOLEAN NOT NULL DEFAULT FALSE,
    crear_admin             BOOLEAN NOT NULL DEFAULT FALSE
);

-- ======================
-- Tabla rol_politica
-- ======================

CREATE TABLE rol_politica (
    id_rol       BIGINT NOT NULL,
    id_politica  BIGINT NOT NULL,

    CONSTRAINT pk_rol_politica PRIMARY KEY (id_rol, id_politica),

    CONSTRAINT fk_rol_politica_rol
        FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_rol_politica_politica
        FOREIGN KEY (id_politica) REFERENCES politica(id_politica)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla institucion
-- ======================

CREATE TABLE institucion (
    id_institucion  BIGSERIAL PRIMARY KEY,
    categoria       VARCHAR(30)  NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    razon_social    VARCHAR(150),
    detalle         TEXT,
    direccion       VARCHAR(200),
    telefono_ins    VARCHAR(20),
    latitud         NUMERIC(8,6),
    longitud        NUMERIC(9,6),
    estado          BOOLEAN NOT NULL DEFAULT TRUE,
    disponibilidad_operativa VARCHAR(30)
);

-- ======================
-- Tabla usuario
-- ======================

CREATE TABLE usuario (
    id_usuario        BIGSERIAL PRIMARY KEY,
    id_rol            BIGINT NOT NULL,
    id_institucion    BIGINT,
    nombre            VARCHAR(100) NOT NULL,
    primer_apellido   VARCHAR(50)  NOT NULL,
    segundo_apellido  VARCHAR(50),
    telefono          VARCHAR(20),
    contrasena        VARCHAR(60)  NOT NULL,
    correo            VARCHAR(254) NOT NULL UNIQUE,
    fecha_eliminacion TIMESTAMP,
    estado            BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_usuario_institucion
        FOREIGN KEY (id_institucion) REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ======================
-- Tabla sesion
-- ======================

CREATE TABLE sesion (
    id_sesion   BIGSERIAL PRIMARY KEY,
    id_usuario  BIGINT NOT NULL,
    token_hash  CHAR(64) NOT NULL UNIQUE,
    expira_en   TIMESTAMP NOT NULL,

    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla cubre_jurisdiccion
-- ======================

CREATE TABLE cubre_jurisdiccion (
    id_zona         BIGINT NOT NULL,
    id_institucion  BIGINT NOT NULL,

    CONSTRAINT pk_cubre_jurisdiccion PRIMARY KEY (id_zona, id_institucion),

    CONSTRAINT fk_jurisdiccion_zona
        FOREIGN KEY (id_zona) REFERENCES zona_geografica(id_zona)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_jurisdiccion_institucion
        FOREIGN KEY (id_institucion) REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla auditoria
-- ======================

CREATE TABLE auditoria (
    id_auditoria  BIGSERIAL PRIMARY KEY,
    evento        VARCHAR(100) NOT NULL,
    fecha_hora    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalle       TEXT
);

-- ======================
-- Tabla auditoriau
-- ======================

CREATE TABLE auditoriau (
    id_auditoriau  BIGSERIAL PRIMARY KEY,
    id_usuario     BIGINT NOT NULL,
    accion         VARCHAR(100) NOT NULL,
    detalle        TEXT,
    fecha_hora     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen      VARCHAR(45),

    CONSTRAINT fk_auditoriau_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ======================
-- Tabla reporte_u
-- ======================

CREATE TABLE reporte_u (
    id_reporte_u     BIGSERIAL PRIMARY KEY,
    id_usuario       BIGINT NOT NULL,
    descripcion      TEXT NOT NULL,
    tipo             VARCHAR(30),
    nivel_prioridad  VARCHAR(10),
    estado           VARCHAR(20) NOT NULL DEFAULT 'RECIBIDO',
    fecha_envio      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitud          NUMERIC(8,6),
    longitud         NUMERIC(9,6),
    indicador        TEXT,
    foto_url         VARCHAR(500),

    CONSTRAINT fk_reporte_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ======================
-- Tabla alerta
-- ======================

CREATE TABLE alerta (
    id_alerta            BIGSERIAL PRIMARY KEY,
    fecha                DATE NOT NULL,
    hora                 TIME NOT NULL,
    estado               VARCHAR(20) NOT NULL,
    puntaje              NUMERIC(4,3),
    clasificacion        VARCHAR(20),
    fecha_confirmacion   TIMESTAMP,
    fecha_cierre         TIMESTAMP
);

-- ======================
-- Tabla recepciona
-- ======================

CREATE TABLE recepciona (
    id_usuario  BIGINT NOT NULL,
    id_alerta   BIGINT NOT NULL,

    CONSTRAINT pk_recepciona PRIMARY KEY (id_usuario, id_alerta),

    CONSTRAINT fk_recepciona_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_recepciona_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla realiza_audi
-- ======================

CREATE TABLE realiza_audi (
    id_auditoria  BIGINT NOT NULL,
    id_alerta     BIGINT NOT NULL,

    CONSTRAINT pk_realiza_audi PRIMARY KEY (id_auditoria, id_alerta),

    CONSTRAINT fk_realiza_audi_auditoria
        FOREIGN KEY (id_auditoria) REFERENCES auditoria(id_auditoria)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_realiza_audi_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla genera_ru
-- ======================

CREATE TABLE genera_ru (
    id_alerta     BIGINT NOT NULL,
    id_reporte_u  BIGINT NOT NULL,

    CONSTRAINT pk_genera_ru PRIMARY KEY (id_alerta, id_reporte_u),

    CONSTRAINT fk_genera_ru_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_genera_ru_reporte
        FOREIGN KEY (id_reporte_u) REFERENCES reporte_u(id_reporte_u)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla envia
-- ======================

CREATE TABLE envia (
    id_alerta             BIGINT NOT NULL,
    id_institucion        BIGINT NOT NULL,
    estado                VARCHAR(10) NOT NULL,
    fecha_envio           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion   TIMESTAMP,

    CONSTRAINT pk_envia PRIMARY KEY (id_alerta, id_institucion),

    CONSTRAINT fk_envia_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_envia_institucion
        FOREIGN KEY (id_institucion) REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ======================
-- Tabla motor_det
-- ======================

CREATE TABLE motor_det (
    id_motordet                 BIGSERIAL PRIMARY KEY,
    ventana_base_min            SMALLINT NOT NULL,
    umbral_z                    NUMERIC(3,1) NOT NULL,
    cusum_h                     NUMERIC(3,1) NOT NULL,
    umbral_confirmacion         NUMERIC(3,2) NOT NULL,
    umbral_descarte             NUMERIC(3,2) NOT NULL,
    tiempo_max_evaluacion_min   SMALLINT NOT NULL,
    radio_vecindad_m            INTEGER NOT NULL
);

-- ======================
-- Tabla parametro_variable
-- ======================

CREATE TABLE parametro_variable (
    id_parametro_variable  BIGSERIAL PRIMARY KEY,
    id_motordet            BIGINT NOT NULL,
    tipo_variable           VARCHAR(20) NOT NULL,
    umbral_critico          NUMERIC(8,2),

    CONSTRAINT fk_parametro_variable_motor
        FOREIGN KEY (id_motordet) REFERENCES motor_det(id_motordet)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT uq_parametro_variable_motor_tipo
        UNIQUE (id_motordet, tipo_variable)
);

-- ======================
-- Tabla predio
-- ======================

CREATE TABLE predio (
    id_predio             BIGSERIAL PRIMARY KEY,
    id_zona               BIGINT NOT NULL,
    id_motordet           BIGINT NOT NULL,
    tipo_predio           VARCHAR(20) NOT NULL,
    nombre                VARCHAR(100) NOT NULL,
    direccion             VARCHAR(200) NOT NULL,
    latitud               NUMERIC(8,6) NOT NULL,
    longitud              NUMERIC(9,6) NOT NULL,
    fecha_evaluacion      DATE,
    irp                   NUMERIC(4,3),
    estado_electrico      SMALLINT,
    estado_gas            SMALLINT,
    fuentes_calor         SMALLINT,
    carga_combustible     SMALLINT,
    material_construccion SMALLINT,
    ocupacion             SMALLINT,
    nivel_proteccion      SMALLINT,

    CONSTRAINT fk_predio_zona
        FOREIGN KEY (id_zona) REFERENCES zona_geografica(id_zona)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_predio_motor
        FOREIGN KEY (id_motordet) REFERENCES motor_det(id_motordet)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ======================
-- Tabla sensor
-- ======================

CREATE TABLE sensor (
    id_sensor          BIGSERIAL PRIMARY KEY,
    id_predio          BIGINT NOT NULL,
    nombre             VARCHAR(100) NOT NULL,
    tipo_sensor        VARCHAR(20) NOT NULL,
    unidad_medida      VARCHAR(15),
    modelo             VARCHAR(50),
    fabricante         VARCHAR(100),
    fecha_instalacion  DATE,
    estado             VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    rango_min          NUMERIC(8,2) NOT NULL,
    rango_max          NUMERIC(8,2) NOT NULL,

    CONSTRAINT fk_sensor_predio
        FOREIGN KEY (id_predio) REFERENCES predio(id_predio)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ======================
-- Tabla lectura
-- ======================

CREATE TABLE lectura (
    id_lectura      BIGSERIAL PRIMARY KEY,
    id_sensor       BIGINT NOT NULL,
    id_alerta       BIGINT,
    valor           NUMERIC(10,4) NOT NULL,
    fecha_hora      TIMESTAMP NOT NULL,
    estado_lectura  VARCHAR(10) NOT NULL,
    tipo_variable   VARCHAR(20) NOT NULL,

    CONSTRAINT fk_lectura_sensor
        FOREIGN KEY (id_sensor) REFERENCES sensor(id_sensor)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_lectura_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ======================
-- Tabla informe_atencion
-- ======================

CREATE TABLE informe_atencion (
    id_informe_atencion  BIGSERIAL PRIMARY KEY,
    id_alerta            BIGINT NOT NULL,
    id_institucion       BIGINT NOT NULL,
    id_usuario           BIGINT NOT NULL,
    estado               VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    fecha_incidente      DATE,
    hora_recepcion       TIME,
    hora_salida          TIME,
    hora_llegada         TIME,
    hora_control         TIME,
    hora_finalizacion    TIME,
    personal             SMALLINT,
    vehiculos            SMALLINT,
    personas_afectadas   SMALLINT,
    personas_evacuadas   SMALLINT,
    heridos              SMALLINT,
    fallecidos           SMALLINT,
    danos_materiales     TEXT,
    causa                TEXT,
    acciones             TEXT,
    observaciones        TEXT,
    recomendaciones      TEXT,
    fecha_envio          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_informe_atencion_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_informe_atencion_institucion
        FOREIGN KEY (id_institucion) REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_informe_atencion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ======================
-- Tabla notificacion
-- ======================

CREATE TABLE notificacion (
    id_notificacion  BIGSERIAL PRIMARY KEY,
    id_usuario       BIGINT NOT NULL,
    id_alerta        BIGINT,
    tipo             VARCHAR(20) NOT NULL,
    titulo           VARCHAR(150) NOT NULL,
    mensaje          TEXT NOT NULL,
    fecha_hora       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida            BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_notificacion_alerta
        FOREIGN KEY (id_alerta) REFERENCES alerta(id_alerta)
        ON UPDATE CASCADE ON DELETE SET NULL
);
