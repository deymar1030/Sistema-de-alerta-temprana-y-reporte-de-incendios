import { connectMqttClient } from "./client.js";
import { createLecturaHandler } from "./dependencies.js";

const TOPICO_LECTURAS = "incendios/+/+";

export function startMqttSubscriber({ notifier, dependencies = createLecturaHandler, createClient = connectMqttClient }) {
  const { handleMessage, useCase } = dependencies(notifier);
  const client = createClient();

  client.on("connect", () => {
    client.subscribe(TOPICO_LECTURAS, { qos: 1 }, (error, granted) => {
      if (error || granted?.some((g) => g.qos === 128)) {
        console.error(`[mqtt] no se pudo suscribir a "${TOPICO_LECTURAS}":`, error?.message || 'ACL rechazada');
      } else {
        console.log(`[mqtt] suscrito a "${TOPICO_LECTURAS}"`);
        client.emit('lecturas:subscribed');
      }
    });
  });

  // MQTT.js espera este callback antes de enviar PUBACK (QoS 1).
  client.handleMessage = (packet, done) => {
    handleMessage(packet.topic, packet.payload, packet).then(() => done(), (error) => {
      console.error('[mqtt] transaccion fallida; se reintentara tras reconectar:', error.message);
      client.stream?.destroy();
      done(error);
    });
  };
  let mantenimiento = null;
  const revisar = () => {
    if (!mantenimiento) mantenimiento = useCase.vencerAlertas()
      .catch((e) => console.error('[deteccion] revision de plazos:', e.message))
      .finally(() => { mantenimiento = null; });
  };
  const timer = setInterval(revisar, 15000);
  timer.unref();
  client.once('end', () => clearInterval(timer));
  revisar();
  client.connect();

  return client;
}
