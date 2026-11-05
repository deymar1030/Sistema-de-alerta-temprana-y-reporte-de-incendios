-- El motor usa `signo` para invertir variables cuya direccion peligrosa es
-- que el valor BAJE (hoy solo HUMEDAD: aire seco = riesgo de incendio) antes
-- de compararlas contra umbral_critico y contra su historial estadistico.
-- Antes vivia hardcodeado en CONFIGURACION_BASE (codigo), igual para todos
-- los predios; ahora es dato por variable/motor en la BD.
-- Ver backend/api/domain/motorDeteccion/configuracion.js.
BEGIN;

ALTER TABLE parametro_variable
    ADD COLUMN IF NOT EXISTS signo SMALLINT NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_parametro_variable_signo'
    ) THEN
        ALTER TABLE parametro_variable
            ADD CONSTRAINT chk_parametro_variable_signo CHECK (signo IN (1, -1));
    END IF;
END $$;

UPDATE parametro_variable SET signo = -1 WHERE tipo_variable = 'HUMEDAD' AND signo <> -1;

COMMIT;
