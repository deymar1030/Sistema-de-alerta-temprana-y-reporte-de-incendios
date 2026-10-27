const TOPIC_PATTERN = /^incendios\/([1-9]\d{0,18})\/([1-9]\d{0,18})$/;

export function parseMensaje(topic, payload) {
  if (!Buffer.isBuffer(payload) || payload.length > 2048) throw new Error('Payload demasiado grande o invalido');
  const match = TOPIC_PATTERN.exec(topic);
  if (!match) {
    throw new Error(`Topico con forma inesperada: "${topic}" (se espera incendios/{id_predio}/{id_sensor})`);
  }

  const [, id_predio, id_sensor] = match;
  if ([id_predio, id_sensor].some((id) => BigInt(id) > 9223372036854775807n)) throw new Error('ID fuera de rango');

  let body;
  try {
    body = JSON.parse(payload.toString());
  } catch {
    throw new Error(`Payload no es JSON valido en "${topic}"`);
  }

  if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some((k) => !['valor', 'fecha_hora'].includes(k))) {
    throw new Error('Payload debe contener solo valor y fecha_hora');
  }
  const { valor, fecha_hora } = body;
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error(`Payload invalido en "${topic}": "valor" debe ser un numero`);
  }

  if (Math.abs(valor) > 999999.9999) throw new Error('Valor no representable en lectura.valor');
  const fecha = new Date(fecha_hora);
  if (typeof fecha_hora !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(fecha_hora) || Number.isNaN(fecha.getTime())) {
    throw new Error(`Payload invalido en "${topic}": "fecha_hora" debe ser ISO 8601`);
  }
  const dia = new Date(`${fecha_hora.slice(0, 10)}T00:00:00Z`);
  if (Number(fecha_hora.slice(0, 4)) < 1 || Number(fecha_hora.slice(11, 13)) > 23 ||
      Number.isNaN(+dia) || dia.toISOString().slice(0, 10) !== fecha_hora.slice(0, 10)) {
    throw new Error('Fecha de calendario invalida');
  }

  return {
    id_predio,
    id_sensor,
    valor: Number(valor.toFixed(4)),
    fecha_hora: fecha,
  };
}

export function createMqttMessageHandler(onLectura, logger = console) {
  return async (topic, payload, packet = {}) => {
    let lectura;
    try {
      if (packet.retain) throw new Error('No se admiten lecturas retenidas');
      lectura = parseMensaje(topic, payload);
    } catch (error) {
      logger.warn("[mqtt] mensaje descartado:", error.message);
      return { ignorada: 'MENSAJE_INVALIDO' };
    }

    // Los errores de persistencia suben al transporte: no confirmar entrega antes del commit.
    return onLectura(lectura);
  };
}
