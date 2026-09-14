import { SensorRepository } from "../../../../application/sensor/repositories/sensor.repository.js";
import { SensorMapper } from "../../../../domain/sensor/mappers/sensor.mapper.js";
import prisma from "../../../prismaConfig/prismaClient.js";

export class SensorRepositoryImpl extends SensorRepository {
  async create(createSensorDTO) {
    try {
      console.log("DTO que llega a Prisma:", createSensorDTO);
      const record = await prisma.sensor.create({
        data: {
          fecha_instalacion: new Date(createSensorDTO.fecha_instalacion),
          estado: createSensorDTO.estado,
          tipo_sensor: createSensorDTO.tipo_sensor,
          unidad_medida: createSensorDTO.unidad_medida,
          nombre: createSensorDTO.nombre,
          modelo: createSensorDTO.modelo,
          fabricante: createSensorDTO.fabricante,
          id_ubic_geo: Number(createSensorDTO.id_ubic_geo),
        },
      });
      return SensorMapper.toResponseDTO(SensorMapper.toEntity(record));
    } catch (error) {
      console.error("Error detallado de Prisma:", error);
      throw error;
    }
  }
  async findAll() {
    const records = await prisma.sensor.findMany();
    const entities = records.map((record) => SensorMapper.toEntity(record));
    return SensorMapper.toResponseDTOArray(entities);
  }

  async findById(id) {
    const record = await prisma.sensor.findUnique({
      where: { id_sensor: Number(id) },
    });
    if (!record) return null;
    return SensorMapper.toResponseDTO(SensorMapper.toEntity(record));
  }

  async update(id, updateSensorDTO) {
    const record = await prisma.sensor.update({
      where: { id_sensor: Number(id) },
      data: {
        ...(updateSensorDTO.fecha_instalacion && { fecha_instalacion: new Date(updateSensorDTO.fecha_instalacion) }),
        ...(updateSensorDTO.estado && { estado: updateSensorDTO.estado }),
        ...(updateSensorDTO.tipo_sensor && { tipo_sensor: updateSensorDTO.tipo_sensor }),
        ...(updateSensorDTO.unidad_medida && { unidad_medida: updateSensorDTO.unidad_medida }),
        ...(updateSensorDTO.nombre && { nombre: updateSensorDTO.nombre }),
        ...(updateSensorDTO.modelo && { modelo: updateSensorDTO.modelo }),
        ...(updateSensorDTO.fabricante && { fabricante: updateSensorDTO.fabricante }),
        ...(updateSensorDTO.id_ubic_geo && {
          ubicacion_geografica: {
            connect: { id_ubic_geo: Number(updateSensorDTO.id_ubic_geo) }
          }
        }),
      },
    });
    return SensorMapper.toResponseDTO(SensorMapper.toEntity(record));
  }

  async delete(id) {
    const record = await prisma.sensor.delete({
      where: { id_sensor: Number(id) },
    });
    return SensorMapper.toResponseDTO(SensorMapper.toEntity(record));
  }
}