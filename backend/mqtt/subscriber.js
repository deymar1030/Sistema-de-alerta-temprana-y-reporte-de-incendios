const TOPIC_PATTERN = /^incendios\/(\d+)\/(\d+)$/;

// Separa id_predio/id_sensor del topico y valida la forma cruda del
// payload (docs/TopicosMQTT.md §3): { "valor": number, "fecha_hora": ISO8601 }.
// Lanza si el mensaje no tiene una forma valida -- quien llama decide si
// lo loguea y sigue, o lo deja reventar.
function parseMensaje(topic, payload) {
  const match = TOPIC_PATTERN.exec(topic);
  if (!match) {
    throw new Error(`Topico con forma inesperada: "${topic}" (se espera incendios/{id_predio}/{id_sensor})`);
  }

  const [, id_predio, id_sensor] = match;

  let body;
  try {
    body = JSON.parse(payload.toString());
  } catch {
    throw new Error(`Payload no es JSON valido en "${topic}"`);
  }

  const { valor, fecha_hora } = body;
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error(`Payload invalido en "${topic}": "valor" debe ser un numero`);
  }

  const fecha = new Date(fecha_hora);
  if (typeof fecha_hora !== "string" || Number.isNaN(fecha.getTime())) {
    throw new Error(`Payload invalido en "${topic}": "fecha_hora" debe ser ISO 8601`);
  }

  return {
    id_predio: Number(id_predio),
    id_sensor: Number(id_sensor),
    valor,
    fecha_hora: fecha,
  };
}

// equivalente a un "controller", pero para MQTT (docs/GuiaTiempoReal.md
// §2): traduce "llego un mensaje" en una llamada al handler de negocio
// inyectado. Un mensaje invalido se loguea y se descarta -- no debe tirar
// el proceso ni la conexion al broker.
export function createMqttMessageHandler(onLectura) {
  return async (topic, payload) => {
    let lectura;
    try {
      lectura = parseMensaje(topic, payload);
    } catch (error) {
      console.error("[mqtt] mensaje descartado:", error.message);
      return;
    }

    try {
      await onLectura(lectura);
    } catch (error) {
      console.error(`[mqtt] error procesando lectura de "${topic}":`, error.message);
    }
  };
}
