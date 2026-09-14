import { SensorEntity } from "../entities/sensor.entity.js";

export class SensorMapper {
  static toEntity(object) {
    const { id_sensor, fecha_instalacion, estado, tipo_sensor, unidad_medida, nombre, modelo, fabricante } = object;
    return new SensorEntity({
      id_sensor,
      fecha_instalacion,
      estado,
      tipo_sensor,
      unidad_medida,
      nombre,
      modelo,
      fabricante,
    });
  }

  static toResponseDTO(entity) {
    return {
      id_sensor: entity.id_sensor,
      fecha_instalacion: entity.fecha_instalacion,
      estado: entity.estado,
      tipo_sensor: entity.tipo_sensor,
      unidad_medida: entity.unidad_medida,
      nombre: entity.nombre,
      modelo: entity.modelo,
      fabricante: entity.fabricante,
    };
  }

  static toResponseDTOArray(entities) {
    return entities.map((entity) => SensorMapper.toResponseDTO(entity));
  }
}