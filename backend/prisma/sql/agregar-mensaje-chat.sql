-- Chat de coordinacion entre instituciones. tipo_canal = 'GLOBAL' (todas las
-- instituciones) o 'CATEGORIA' (solo instituciones de la misma categoria,
-- ej. BOMBEROS con BOMBEROS; categoria queda NULL en el canal GLOBAL).
-- tipo_mensaje separa mensajes de un usuario de futuros mensajes
-- automaticos del sistema (ej. al designar personal a una alerta).
-- Ver bd/bd.sql y backend/prisma/schema.prisma (modelo mensaje_chat).
BEGIN;

CREATE TABLE IF NOT EXISTS mensaje_chat (
    id_mensaje             BIGSERIAL PRIMARY KEY,
    tipo_canal             VARCHAR(10) NOT NULL,
    categoria              VARCHAR(30),
    id_usuario             BIGINT NOT NULL,
    id_institucion_emisor  BIGINT NOT NULL,
    contenido              TEXT NOT NULL,
    tipo_mensaje           VARCHAR(10) NOT NULL DEFAULT 'USUARIO',
    fecha_hora             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensaje_chat_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_mensaje_chat_institucion
        FOREIGN KEY (id_institucion_emisor) REFERENCES institucion(id_institucion)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_mensaje_chat_tipo_canal
        CHECK (tipo_canal IN ('GLOBAL', 'CATEGORIA')),

    CONSTRAINT chk_mensaje_chat_categoria
        CHECK (tipo_canal = 'GLOBAL' OR categoria IS NOT NULL),

    CONSTRAINT chk_mensaje_chat_tipo_mensaje
        CHECK (tipo_mensaje IN ('USUARIO', 'SISTEMA'))
);

CREATE INDEX IF NOT EXISTS idx_mensaje_chat_canal ON mensaje_chat(tipo_canal, categoria, fecha_hora);

COMMIT;
