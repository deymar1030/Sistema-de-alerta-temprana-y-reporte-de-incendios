-- PROPUESTA PARA REVISION. No se ejecuta al arrancar ni al aprovisionar MQTT.
-- Solo INSERT de datos de simulacion; sin CREATE/ALTER/DROP de tablas.
-- Conserva IDs/variables de los clientes originales. Aborta si algun ID ya existe.
BEGIN;
DO $$
DECLARE zona_id BIGINT; motor_id BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM predio WHERE id_predio IN (8,12,15)) OR
     EXISTS (SELECT 1 FROM sensor WHERE id_sensor IN (31,32,33,34,51,52,70,71,72)) THEN
    RAISE EXCEPTION 'IDs de simulacion ocupados; revisar el manifest antes de cargar';
  END IF;
  INSERT INTO zona_geografica(nombre,departamento,municipio,descripcion)
  VALUES ('SIMULACION MQTT','La Paz','La Paz','Datos sinteticos de desarrollo, no predios operativos') RETURNING id_zona INTO zona_id;
  INSERT INTO motor_det(ventana_base_min,umbral_z,cusum_h,umbral_confirmacion,umbral_descarte,tiempo_max_evaluacion_min,radio_vecindad_m)
  VALUES (30,3,5,0.60,0.45,10,500) RETURNING id_motordet INTO motor_id;
  INSERT INTO parametro_variable(id_motordet,tipo_variable,umbral_critico) VALUES
    (motor_id,'TEMPERATURA',70),(motor_id,'HUMEDAD',NULL),(motor_id,'CO2',NULL),(motor_id,'GAS_LEL',NULL);
  INSERT INTO predio(id_predio,id_zona,id_motordet,tipo_predio,nombre,direccion,latitud,longitud) VALUES
    (8,zona_id,motor_id,'EDIFICIO','Simulador 8','Ubicacion sintetica 8',-16.500000,-68.150000),
    (12,zona_id,motor_id,'EDIFICIO','Simulador 12','Ubicacion sintetica 12',-16.501000,-68.150000),
    (15,zona_id,motor_id,'EDIFICIO','Simulador 15','Ubicacion sintetica 15',-16.502000,-68.150000);
  INSERT INTO sensor(id_sensor,id_predio,nombre,tipo_sensor,unidad_medida,modelo,rango_min,rango_max) VALUES
    (31,8,'Temperatura 31','TEMPERATURA','°C','SIMULADO',-40,125),
    (32,8,'Humedad 32','HUMEDAD','%','SIMULADO',0,100),
    (33,8,'CO2 33','CO2','ppm','SIMULADO',0,10000),
    (34,8,'Gas LEL 34','GAS_LEL','%LEL','SIMULADO',0,100),
    (51,12,'Temperatura 51','TEMPERATURA','°C','SIMULADO',-40,125),
    (52,12,'CO2 52','CO2','ppm','SIMULADO',0,10000),
    (70,15,'Temperatura 70','TEMPERATURA','°C','SIMULADO',-40,125),
    (71,15,'Humedad 71','HUMEDAD','%','SIMULADO',0,100),
    (72,15,'Gas LEL 72','GAS_LEL','%LEL','SIMULADO',0,100);
END $$;
SELECT setval(pg_get_serial_sequence('predio','id_predio'), (SELECT MAX(id_predio) FROM predio));
SELECT setval(pg_get_serial_sequence('sensor','id_sensor'), (SELECT MAX(id_sensor) FROM sensor));
COMMIT;
