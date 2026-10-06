-- ======================
-- Tabla usuario
-- ======================

CREATE INDEX idx_usuario_activos ON usuario(id_institucion) WHERE fecha_eliminacion IS NULL;

-- ======================
-- Tabla sesion
-- ======================

CREATE INDEX idx_sesion_usuario ON sesion(id_usuario);

-- ======================
-- Tabla auditoriau
-- ======================

CREATE INDEX idx_auditoriau_usuario ON auditoriau(id_usuario);

-- ======================
-- Tabla reporte_u
-- ======================

CREATE INDEX idx_reporte_usuario ON reporte_u(id_usuario);

-- ======================
-- Tabla alerta
-- ======================

CREATE INDEX idx_alerta_fecha ON alerta(fecha);
CREATE INDEX idx_alerta_estado ON alerta(estado);

-- ======================
-- Tabla envia
-- ======================

CREATE INDEX idx_envia_alerta ON envia(id_alerta);
CREATE INDEX idx_envia_institucion ON envia(id_institucion);

-- ======================
-- Tabla predio
-- ======================

CREATE INDEX idx_predio_zona ON predio(id_zona);
CREATE INDEX idx_predio_motor ON predio(id_motordet);
CREATE INDEX idx_predio_tipo ON predio(tipo_predio);

-- ======================
-- Trigger - predio.irp
-- ======================

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

-- ======================
-- Tabla sensor
-- ======================

CREATE INDEX idx_sensor_predio ON sensor(id_predio);

-- ======================
-- Tabla lectura
-- ======================

CREATE INDEX idx_lectura_sensor_fecha ON lectura(id_sensor, fecha_hora);
CREATE INDEX idx_lectura_alerta ON lectura(id_alerta);

-- ======================
-- Tabla informe_atencion
-- ======================

CREATE INDEX idx_informe_atencion_alerta ON informe_atencion(id_alerta);
CREATE INDEX idx_informe_atencion_institucion ON informe_atencion(id_institucion);

-- ======================
-- Tabla notificacion
-- ======================

CREATE INDEX idx_notificacion_usuario ON notificacion(id_usuario, leida);
CREATE INDEX idx_notificacion_alerta ON notificacion(id_alerta);
