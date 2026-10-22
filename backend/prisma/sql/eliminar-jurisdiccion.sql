-- Cambio solicitado: elimina exclusivamente la relacion de jurisdiccion.
-- No elimina instituciones ni zonas. No usar CASCADE.
BEGIN;
DROP TABLE IF EXISTS cubre_jurisdiccion;
COMMIT;
