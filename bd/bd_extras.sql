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
