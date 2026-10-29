-- Reutiliza `recepciona` (usuario<->alerta) como asignacion real de OPERATIVO
-- a una alerta, en vez de solo "quien la recibio". No crea tabla nueva.
-- Ver bd/DiccionarioDatos.md y docs/IntegracionOperativa.md ("Asignacion de OPERATIVO").
BEGIN;

ALTER TABLE recepciona
    ADD COLUMN IF NOT EXISTS estado           VARCHAR(10) NOT NULL DEFAULT 'ASIGNADO',
    ADD COLUMN IF NOT EXISTS fecha_asignacion TIMESTAMP   NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS fecha_liberacion TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_recepciona_usuario_estado ON recepciona(id_usuario, estado);

COMMIT;
