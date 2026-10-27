import { RolNombres } from "../../../domain/rol/rolNombres.js";

// El JEFE_INSTITUCION reparte una alerta ya recibida por su institucion
// (debe existir fila en `envia`) entre OPERATIVO puntuales de esa misma
// institucion -- nunca todos a la vez. Persiste una notificacion por
// destinatario y la emite en vivo por WebSocket (rooms.usuario).
export default class AsignarAlertaOperativosUseCase {
  constructor({ notificacionRepository, usuarioRepository, enviaRepository, realtimeNotifier }) {
    this.notificacionRepository = notificacionRepository;
    this.usuarioRepository = usuarioRepository;
    this.enviaRepository = enviaRepository;
    this.realtimeNotifier = realtimeNotifier;
  }

  async execute({ id_alerta, id_usuarios, jefe }) {
    if (!id_alerta) throw new Error("Missing id_alerta");
    if (!Array.isArray(id_usuarios) || id_usuarios.length === 0) {
      throw new Error("id_usuarios debe ser un arreglo con al menos un usuario");
    }

    const idsSolicitados = [...new Set(id_usuarios.map(Number))];

    const envio = await this.enviaRepository.findByIds(id_alerta, jefe.id_institucion);
    if (!envio) {
      throw new Error("Esta alerta no fue enviada a tu institución");
    }

    const operativosInstitucion = await this.usuarioRepository.findByInstitucionAndRol(
      jefe.id_institucion,
      RolNombres.OPERATIVO
    );
    const idsOperativosValidos = new Set(operativosInstitucion.map((u) => Number(u.id_usuario)));

    const idsInvalidos = idsSolicitados.filter((id) => !idsOperativosValidos.has(id));
    if (idsInvalidos.length > 0) {
      throw new Error(
        `Usuario(s) no válidos: no son OPERATIVO activo de tu institución: ${idsInvalidos.join(", ")}`
      );
    }

    const notificacionesData = idsSolicitados.map((id_usuario) => ({
      id_usuario,
      id_usuario_emisor: jefe.id_usuario,
      id_alerta,
      tipo: "ALERTA",
      titulo: "Alerta asignada",
      mensaje: `${jefe.nombre} ${jefe.primer_apellido} te asignó la alerta #${id_alerta}.`,
    }));

    const notificaciones = await this.notificacionRepository.createMany(notificacionesData);

    await Promise.all(notificaciones.map((notificacion) => this.realtimeNotifier.emitNotificacion(notificacion)));

    return notificaciones;
  }
}
