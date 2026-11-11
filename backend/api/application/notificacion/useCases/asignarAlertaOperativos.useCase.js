import { RolNombres } from "../../../domain/rol/rolNombres.js";

// El JEFE_INSTITUCION reparte una alerta ya recibida por su institucion
// (debe existir fila en `envia`) entre OPERATIVO puntuales de esa misma
// institucion -- nunca todos a la vez. Persiste la asignacion real en
// `recepciona` (para que el operativo quede no disponible para otra
// alerta), una notificacion por destinatario, y emite en vivo por
// WebSocket (rooms.usuario).
export default class AsignarAlertaOperativosUseCase {
  constructor({ notificacionRepository, usuarioRepository, enviaRepository, recepcionaRepository, reporteURepository, realtimeNotifier }) {
    this.notificacionRepository = notificacionRepository;
    this.usuarioRepository = usuarioRepository;
    this.enviaRepository = enviaRepository;
    this.recepcionaRepository = recepcionaRepository;
    this.reporteURepository = reporteURepository;
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

    // Un operativo ya ASIGNADO a OTRA alerta activa no puede recibir una
    // segunda: no sabria a donde ir. Reasignarlo a la MISMA alerta si es
    // idempotente.
    const asignacionesActivas = await this.recepcionaRepository.findAsignacionesActivas(idsSolicitados);
    const ocupadosEnOtraAlerta = asignacionesActivas.filter((a) => Number(a.id_alerta) !== Number(id_alerta));
    if (ocupadosEnOtraAlerta.length > 0) {
      const detalle = ocupadosEnOtraAlerta.map((a) => `usuario ${a.id_usuario} -> alerta #${a.id_alerta}`).join(", ");
      throw new Error(`Usuario(s) ya asignado(s) a otra alerta activa: ${detalle}`);
    }

    // Se chequea ANTES de asignar: es la unica forma de distinguir "esta es
    // la primera vez que esta institucion (o cualquier otra) envia
    // operativos a esta alerta" de una reasignacion/ampliacion posterior.
    const esPrimeraAsignacion = !(await this.recepcionaRepository.existeAsignacionParaAlerta(id_alerta));

    await this.recepcionaRepository.asignar(id_alerta, idsSolicitados);

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

    // Solo la PRIMERA vez que la alerta recibe operativos: a partir de ahi
    // ya hay alguien yendo a atenderla, asi que quien la reporto no
    // necesita seguir mandando mas reportes del mismo incendio. Si la
    // alerta nacio de un sensor (sin reporte ciudadano), no hay a quien
    // avisar y la lista sale vacia.
    if (esPrimeraAsignacion) await this.notificarCiudadanosAtencion(id_alerta);

    return notificaciones;
  }

  async notificarCiudadanosAtencion(id_alerta) {
    const idsCiudadanos = await this.reporteURepository.findCiudadanosByAlerta(id_alerta);
    if (!idsCiudadanos.length) return;

    const notificacionesData = idsCiudadanos.map((id_usuario) => ({
      id_usuario,
      id_alerta,
      tipo: "REPORTE",
      titulo: "Tu reporte ya está siendo atendido",
      mensaje: "Una institución ya envió personal a atender el incendio que reportaste. No hace falta que envíes más reportes sobre este mismo incidente.",
    }));

    const notificaciones = await this.notificacionRepository.createMany(notificacionesData);
    await Promise.all(notificaciones.map((notificacion) => this.realtimeNotifier.emitNotificacion(notificacion)));
  }
}
