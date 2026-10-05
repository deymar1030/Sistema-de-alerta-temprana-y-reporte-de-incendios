-- ============================================================
-- 1. ZONA_GEOGRAFICA
-- ============================================================

CREATE TABLE zona_geografica (
    id_zona               BIGSERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    departamento          VARCHAR(40)  NOT NULL,
    municipio             VARCHAR(80)  NOT NULL,
    descripcion           TEXT,
    estado                BOOLEAN NOT NULL DEFAULT TRUE,
    densidad_poblacional  NUMERIC(10,2)
);




-- ============================================================
-- 2. ROL
-- ============================================================

CREATE TABLE rol (
    id_rol           BIGSERIAL PRIMARY KEY,
    nombre_rol       VARCHAR(50) NOT NULL UNIQUE,
    mfa_obligatorio  BOOLEAN NOT NULL DEFAULT FALSE
);




-- ============================================================
-- 3. POLITICA
-- ============================================================

CREATE TABLE politica (
    id_politica             BIGSERIAL PRIMARY KEY,
    id_rol                  BIGINT NOT NULL UNIQUE,
    max_intentos_fallidos   SMALLINT NOT NULL DEFAULT 5,
    tiempo_bloqueo_minutos  SMALLINT NOT NULL DEFAULT 15,
    horario_inicio          TIME,
    horario_fin             TIME,
    ip_permitida            TEXT,
    ip_bloqueado            TEXT,
    activar_emergencia      BOOLEAN NOT NULL DEFAULT FALSE,
    ver_auditoria           BOOLEAN NOT NULL DEFAULT FALSE,
    gestionar_usuarios      BOOLEAN NOT NULL DEFAULT FALSE,
    crear_admin             BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_politica_rol
        FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_politica_max_intentos     CHECK (max_intentos_fallidos > 0),
    CONSTRAINT chk_politica_tiempo_bloqueo   CHECK (tiempo_bloqueo_minutos > 0)
);








-- ============================================================
-- 4. INSTITUCION
-- ============================================================

CREATE TABLE institucion (
    id_institucion          BIGSERIAL PRIMARY KEY,
    categoria               VARCHAR(30)  NOT NULL,
    nombre                  VARCHAR(150) NOT NULL,
    razon_social            VARCHAR(150),
    detalle                 TEXT,
    direccion               VARCHAR(200),
    telefono_ins            VARCHAR(20),
    latitud                 NUMERIC(8,6),
    longitud                NUMERIC(9,6),
    estado                  BOOLEAN NOT NULL DEFAULT TRUE,
    disponibilidad_operativa VARCHAR(30),

    CONSTRAINT chk_institucion_categoria
        CHECK (categoria IN ('BOMBEROS', 'POLICIA', 'DEFENSA_CIVIL', 'RESCATE', 'OTRA')),

    CONSTRAINT chk_institucion_latitud  CHECK (latitud  BETWEEN -90  AND 90),
    CONSTRAINT chk_institucion_longitud CHECK (longitud BETWEEN -180 AND 180)
);







-- ============================================================
-- 5. USUARIO
-- ============================================================

CREATE TABLE usuario (
    id_usuario        BIGSERIAL PRIMARY KEY,
    id_rol            BIGINT NOT NULL,
    id_institucion    BIGINT,
    nombre            VARCHAR(100) NOT NULL,
    primer_apellido   VARCHAR(50)  NOT NULL,
    segundo_apellido  VARCHAR(50),
    telefono          VARCHAR(20),
    correo            VARCHAR(254) NOT NULL UNIQUE,
    contrasena        VARCHAR(60)  NOT NULL,
    "multiF_S"        BOOLEAN NOT NULL DEFAULT FALSE,
    "multiF_A"        BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion TIMESTAMP,
    intentos_fallidos SMALLINT NOT NULL DEFAULT 0,
    bloqueado_hasta   TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_usuario_institucion
        FOREIGN KEY (id_institucion) REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_usuario_intentos_fallidos CHECK (intentos_fallidos >= 0)
);









CREATE INDEX idx_usuario_activos ON usuario(id_institucion) WHERE fecha_eliminacion IS NULL;


-- ============================================================
-- 6. SESION
-- ============================================================

CREATE TABLE sesion (
    id_sesion   BIGSERIAL PRIMARY KEY,
    id_usuario  BIGINT NOT NULL,
    token_hash  CHAR(64) NOT NULL UNIQUE,
    expira_en   TIMESTAMP NOT NULL,

    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE INDEX idx_sesion_usuario ON sesion(id_usuario);


-- ============================================================
-- 7. CUBRE_JURISDICCION (N:M)
-- ============================================================

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


-- ============================================================
-- 8. AUDITORIA
-- ============================================================

CREATE TABLE auditoria (
    id_auditoria  BIGSERIAL PRIMARY KEY,
    evento        VARCHAR(100) NOT NULL,
    fecha_hora    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalle       TEXT
);





-- ============================================================
-- 9. AUDITORIAU
-- ============================================================

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





CREATE INDEX idx_auditoriau_usuario ON auditoriau(id_usuario);


-- ============================================================
-- 10. REPORTE_U
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_reporte_nivel_prioridad
        CHECK (nivel_prioridad IN ('BAJA', 'MEDIA', 'ALTA')),

    CONSTRAINT chk_reporte_estado
        CHECK (estado IN ('RECIBIDO', 'EN_REVISION', 'VALIDADO', 'DESCARTADO', 'ATENDIDO')),

    CONSTRAINT chk_reporte_latitud  CHECK (latitud  IS NULL OR latitud  BETWEEN -90  AND 90),
    CONSTRAINT chk_reporte_longitud CHECK (longitud IS NULL OR longitud BETWEEN -180 AND 180)
);


CREATE INDEX idx_reporte_usuario ON reporte_u(id_usuario);


-- ============================================================
-- 11. ALERTA
-- ============================================================

CREATE TABLE alerta (
    id_alerta            BIGSERIAL PRIMARY KEY,
    fecha                DATE NOT NULL,
    hora                 TIME NOT NULL,
    estado               VARCHAR(20) NOT NULL,
    puntaje              NUMERIC(4,3),
    clasificacion        VARCHAR(20),
    fecha_confirmacion   TIMESTAMP,
    fecha_cierre         TIMESTAMP,

    CONSTRAINT chk_alerta_estado
        CHECK (estado IN ('EN_EVALUACION', 'CONFIRMADA', 'DESCARTADA', 'ATENDIDA', 'CERRADA')),

    CONSTRAINT chk_alerta_clasificacion
        CHECK (clasificacion IS NULL OR clasificacion IN ('INCENDIO', 'CLIMA', 'FALLA_SENSOR', 'SIN_EVIDENCIA')),

    CONSTRAINT chk_alerta_puntaje
        CHECK (puntaje IS NULL OR puntaje BETWEEN 0 AND 1),

    CONSTRAINT chk_alerta_fecha_confirmacion
        CHECK (
            (estado IN ('CONFIRMADA', 'ATENDIDA', 'CERRADA') AND fecha_confirmacion IS NOT NULL)
            OR (estado IN ('EN_EVALUACION', 'DESCARTADA') AND fecha_confirmacion IS NULL)
        ),

    CONSTRAINT chk_alerta_fecha_cierre
        CHECK (
            (estado IN ('DESCARTADA', 'CERRADA') AND fecha_cierre IS NOT NULL)
            OR (estado IN ('EN_EVALUACION', 'CONFIRMADA', 'ATENDIDA') AND fecha_cierre IS NULL)
        )
);



CREATE INDEX idx_alerta_fecha ON alerta(fecha);
CREATE INDEX idx_alerta_estado ON alerta(estado);


-- ============================================================
-- 12. RECEPCIONA (N:M) — USUARIO recibe ALERTA
-- ============================================================

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


-- ============================================================
-- 13. REALIZA_AUDI (N:M) — AUDITORIA vinculada a ALERTA
-- ============================================================

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


-- ============================================================
-- 14. GENERA_RU (N:M) — ALERTA genera REPORTE_U
-- ============================================================

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


-- ============================================================
-- 15. ENVIA (N:M) — ALERTA enviada a INSTITUCION
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_envia_estado
        CHECK (estado IN ('ENVIADA', 'RECIBIDA', 'ATENDIDA', 'CERRADA'))
);

CREATE INDEX idx_envia_alerta ON envia(id_alerta);
CREATE INDEX idx_envia_institucion ON envia(id_institucion);


-- ============================================================
-- 16. MOTOR_DET
-- ============================================================

CREATE TABLE motor_det (
    id_motordet                 BIGSERIAL PRIMARY KEY,
    ventana_base_min            SMALLINT NOT NULL,
    umbral_z                    NUMERIC(3,1) NOT NULL,
    cusum_h                     NUMERIC(3,1) NOT NULL,
    umbral_confirmacion         NUMERIC(3,2) NOT NULL,
    umbral_descarte             NUMERIC(3,2) NOT NULL,
    tiempo_max_evaluacion_min   SMALLINT NOT NULL,
    radio_vecindad_m            INTEGER NOT NULL,

    CONSTRAINT chk_motor_umbral_confirmacion CHECK (umbral_confirmacion BETWEEN 0 AND 1),
    CONSTRAINT chk_motor_umbral_descarte     CHECK (umbral_descarte BETWEEN 0 AND 1),
    CONSTRAINT chk_motor_radio_vecindad      CHECK (radio_vecindad_m > 0),
    CONSTRAINT chk_motor_ventanas            CHECK (ventana_base_min > 0 AND tiempo_max_evaluacion_min > 0)
);




-- ============================================================
-- 17. PARAMETRO_VARIABLE
-- ============================================================

CREATE TABLE parametro_variable (
    id_parametro_variable  BIGSERIAL PRIMARY KEY,
    id_motordet            BIGINT NOT NULL,
    tipo_variable           VARCHAR(20) NOT NULL,
    umbral_critico          NUMERIC(8,2),

    CONSTRAINT fk_parametro_variable_motor
        FOREIGN KEY (id_motordet) REFERENCES motor_det(id_motordet)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_parametro_tipo_variable
        CHECK (tipo_variable IN ('TEMPERATURA', 'HUMO', 'CO', 'HUMEDAD')),

    CONSTRAINT uq_parametro_variable_motor_tipo
        UNIQUE (id_motordet, tipo_variable)
);





-- ============================================================
-- 18. PREDIO
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_predio_tipo_predio
        CHECK (tipo_predio IN ('VIVIENDA', 'EDIFICIO', 'MERCADO')),

    CONSTRAINT chk_predio_latitud   CHECK (latitud  BETWEEN -90  AND 90),
    CONSTRAINT chk_predio_longitud  CHECK (longitud BETWEEN -180 AND 180),
    CONSTRAINT chk_predio_irp       CHECK (irp IS NULL OR irp BETWEEN 0.06 AND 1),

    CONSTRAINT chk_predio_estado_electrico      CHECK (estado_electrico      IS NULL OR estado_electrico      IN (1,2,3)),
    CONSTRAINT chk_predio_estado_gas            CHECK (estado_gas            IS NULL OR estado_gas            IN (0,1,2)),
    CONSTRAINT chk_predio_fuentes_calor         CHECK (fuentes_calor         IS NULL OR fuentes_calor         IN (0,1,2)),
    CONSTRAINT chk_predio_carga_combustible     CHECK (carga_combustible     IS NULL OR carga_combustible     IN (1,2,3)),
    CONSTRAINT chk_predio_material_construccion CHECK (material_construccion IS NULL OR material_construccion IN (1,2,3)),
    CONSTRAINT chk_predio_ocupacion             CHECK (ocupacion             IS NULL OR ocupacion             IN (1,2,3)),
    CONSTRAINT chk_predio_nivel_proteccion      CHECK (nivel_proteccion      IS NULL OR nivel_proteccion      IN (0,1,2,3))
);




CREATE INDEX idx_predio_zona ON predio(id_zona);
CREATE INDEX idx_predio_motor ON predio(id_motordet);
CREATE INDEX idx_predio_tipo ON predio(tipo_predio);


CREATE OR REPLACE FUNCTION fn_calcular_irp()
RETURNS TRIGGER AS $$
DECLARE
    n_elec  NUMERIC;
    n_gas   NUMERIC;
    n_calor NUMERIC;
    n_carga NUMERIC;
    n_mat   NUMERIC;
    n_ocup  NUMERIC;
    p_dim   NUMERIC;
    c_dim   NUMERIC;
    m_dim   NUMERIC;
BEGIN
    IF NEW.estado_electrico IS NULL OR NEW.estado_gas IS NULL OR NEW.fuentes_calor IS NULL
       OR NEW.carga_combustible IS NULL OR NEW.material_construccion IS NULL
       OR NEW.ocupacion IS NULL OR NEW.nivel_proteccion IS NULL THEN
        NEW.irp := NULL;
        RETURN NEW;
    END IF;

    n_elec  := 0.1 + 0.9 * (NEW.estado_electrico      - 1)::NUMERIC / (3 - 1);
    n_gas   := 0.1 + 0.9 * (NEW.estado_gas            - 0)::NUMERIC / (2 - 0);
    n_calor := 0.1 + 0.9 * (NEW.fuentes_calor         - 0)::NUMERIC / (2 - 0);
    n_carga := 0.1 + 0.9 * (NEW.carga_combustible     - 1)::NUMERIC / (3 - 1);
    n_mat   := 0.1 + 0.9 * (NEW.material_construccion - 1)::NUMERIC / (3 - 1);
    n_ocup  := 0.1 + 0.9 * (NEW.ocupacion             - 1)::NUMERIC / (3 - 1);

    p_dim := (n_elec + n_gas + n_calor) / 3;
    c_dim := (n_carga + n_mat + n_ocup) / 3;
    m_dim := NEW.nivel_proteccion / 3.0;

    NEW.irp := ROUND((SQRT(p_dim * c_dim) * (1 - 0.4 * m_dim))::NUMERIC, 3);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_predio_calcular_irp
    BEFORE INSERT OR UPDATE OF
        estado_electrico, estado_gas, fuentes_calor,
        carga_combustible, material_construccion, ocupacion, nivel_proteccion
    ON predio
    FOR EACH ROW
    EXECUTE FUNCTION fn_calcular_irp();




-- ============================================================
-- 19. SENSOR
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_sensor_tipo
        CHECK (tipo_sensor IN ('TEMPERATURA', 'HUMO', 'CO', 'HUMEDAD')),

    CONSTRAINT chk_sensor_estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'ERROR')),

    CONSTRAINT chk_sensor_rango
        CHECK (rango_min < rango_max)
);

CREATE INDEX idx_sensor_predio ON sensor(id_predio);


-- ============================================================
-- 20. LECTURA
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_lectura_estado
        CHECK (estado_lectura IN ('VALIDA', 'ANOMALA', 'INVALIDA')),

    CONSTRAINT chk_lectura_tipo_variable
        CHECK (tipo_variable IN ('TEMPERATURA', 'HUMO', 'CO', 'HUMEDAD'))
);

CREATE INDEX idx_lectura_sensor_fecha ON lectura(id_sensor, fecha_hora);
CREATE INDEX idx_lectura_alerta ON lectura(id_alerta);


-- ============================================================
-- 21. INFORME_ATENCION
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_informe_atencion_estado
        CHECK (estado IN ('BORRADOR', 'PENDIENTE', 'COMPLETADO', 'REVISADO')),

    CONSTRAINT chk_informe_atencion_personal           CHECK (personal           IS NULL OR personal           >= 0),
    CONSTRAINT chk_informe_atencion_vehiculos          CHECK (vehiculos          IS NULL OR vehiculos          >= 0),
    CONSTRAINT chk_informe_atencion_personas_afectadas CHECK (personas_afectadas IS NULL OR personas_afectadas >= 0),
    CONSTRAINT chk_informe_atencion_personas_evacuadas CHECK (personas_evacuadas IS NULL OR personas_evacuadas >= 0),
    CONSTRAINT chk_informe_atencion_heridos            CHECK (heridos            IS NULL OR heridos            >= 0),
    CONSTRAINT chk_informe_atencion_fallecidos         CHECK (fallecidos         IS NULL OR fallecidos         >= 0)
);



CREATE INDEX idx_informe_atencion_alerta ON informe_atencion(id_alerta);
CREATE INDEX idx_informe_atencion_institucion ON informe_atencion(id_institucion);


-- ============================================================
-- 22. NOTIFICACION
-- ============================================================

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
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_notificacion_tipo
        CHECK (tipo IN ('ALERTA', 'ENVIO', 'REPORTE', 'SISTEMA'))
);


CREATE INDEX idx_notificacion_usuario ON notificacion(id_usuario, leida);
CREATE INDEX idx_notificacion_alerta ON notificacion(id_alerta);
