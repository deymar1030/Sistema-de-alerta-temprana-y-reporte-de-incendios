import { SensorMapper } from "../../../domain/sensor/mappers/sensor.mapper.js";

function mapSensorCreateRequest(body) {
  return {
    id_predio: body.id_predio,
    nombre: body.nombre,
    tipo_sensor: body.tipo_sensor,
    unidad_medida: body.unidad_medida ?? null,
    modelo: body.modelo ?? null,
    fabricante: body.fabricante ?? null,
    fecha_instalacion: body.fecha_instalacion ?? null,
    estado: body.estado ?? "ACTIVO",
    rango_min: body.rango_min,
    rango_max: body.rango_max,
  };
}

function mapSensorUpdateRequest(body) {
  const campos = [
    "id_predio",
    "nombre",
    "tipo_sensor",
    "unidad_medida",
    "modelo",
    "fabricante",
    "fecha_instalacion",
    "estado",
    "rango_min",
    "rango_max",
  ];

  const data = {};
  for (const campo of campos) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  return data;
}

export class SensorController {
  constructor(sensorService) {
    this.sensorService = sensorService;
  }

  create = async (req, res) => {
    try {
      const sensorData = mapSensorCreateRequest(req.body);
      const result = await this.sensorService.create(sensorData);
      res.status(201).json({ success: true, data: SensorMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  list = async (req, res) => {
    try {
      const sensores = await this.sensorService.getAll({
        id_predio: req.query.id_predio,
        tipo_sensor: req.query.tipo_sensor,
        estado: req.query.estado,
      });
      res.json({ success: true, data: SensorMapper.toResponseDTOArray(sensores) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { sensor, ultima_lectura, predio } = await this.sensorService.getById(req.params.id);
      res.json({ success: true, data: SensorMapper.toResponseDTO(sensor, ultima_lectura, predio) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  listLecturas = async (req, res) => {
    try {
      const lecturas = await this.sensorService.getLecturas(req.params.id, {
        desde: req.query.desde,
        hasta: req.query.hasta,
        limit: req.query.limit,
      });
      res.json({
        success: true,
        data: lecturas.map((l) => ({
          id_lectura: l.id_lectura,
          id_sensor: l.id_sensor,
          id_alerta: l.id_alerta,
          valor: Number(l.valor),
          fecha_hora: l.fecha_hora,
          estado_lectura: l.estado_lectura,
          tipo_variable: l.tipo_variable,
        })),
      });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const sensorData = mapSensorUpdateRequest(req.body);
      const result = await this.sensorService.update(req.params.id, sensorData);
      res.json({ success: true, data: SensorMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  remove = async (req, res) => {
    try {
      await this.sensorService.delete(req.params.id);
      res.json({ success: true, data: null });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
