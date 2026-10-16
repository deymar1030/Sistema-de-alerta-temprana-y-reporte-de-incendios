import { Validators } from "../../../config/validators.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

// Despacho manual: un ADMIN del centro de monitoreo elige a que
// instituciones enviar una alerta ya validada, ademas de las que el motor
// de deteccion ya distribuyo automaticamente por jurisdiccion de zona
// (ver distribuir() en deteccion.repository.impl.js). No reemplaza esa
// distribucion automatica, la complementa para casos que el motor no cubrio.
export default class DespacharAlertaManualUseCase {
  constructor({ alertaRepository, enviaRepository, institucionRepository, usuarioRepository, notificacionRepository, notifier }) {
    this.alertaRepository = alertaRepository;
    this.enviaRepository = enviaRepository;
    this.institucionRepository = institucionRepository;
    this.usuarioRepository = usuarioRepository;
    this.notificacionRepository = notificacionRepository;
    this.notifier = notifier;
  }

  async execute({ id_alerta, id_instituciones }) {
    const errors = [];
    if (!Validators.isValidId(id_alerta)) errors.push("ID de alerta no valido");
    if (!Array.isArray(id_instituciones) || id_instituciones.length === 0) {
      errors.push("id_instituciones debe ser un arreglo con al menos una institucion");
    } else if (id_instituciones.some((id) => !Validators.isValidId(id))) {
      errors.push("id_instituciones contiene un ID no valido");
    }
    if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(", ")}`);

    const alerta = await this.alertaRepository.findById(Number(id_alerta));
    if (!alerta) throw new Error("Alerta not found");

    const idsSolicitados = [...new Set(id_instituciones.map(Number))];
    const instituciones = await Promise.all(idsSolicitados.map((id) => this.institucionRepository.findById(id)));
    const idsInvalidos = idsSolicitados.filter((id, index) => !instituciones[index]);
    if (idsInvalidos.length > 0) {
      throw new Error(`Institucion(es) no encontrada(s): ${idsInvalidos.join(", ")}`);
    }

    const { creados, omitidos } = await this.enviaRepository.crearMuchos(Number(id_alerta), idsSolicitados);

    await Promise.all(creados.map((envio) =>
      this.notifier.emitEnvioActualizado({
        id_alerta: Number(id_alerta),
        id_institucion: Number(envio.id_institucion),
        estado: envio.estado,
        fecha_envio: envio.fecha_envio,
        fecha_actualizacion: envio.fecha_actualizacion,
      })
    ));

    const jefesPorInstitucion = await Promise.all(
      creados.map((envio) => this.usuarioRepository.findByInstitucionAndRol(Number(envio.id_institucion), RolNombres.JEFE_INSTITUCION))
    );
    const notificacionesData = creados.flatMap((envio, index) =>
      jefesPorInstitucion[index].map((jefe) => ({
        id_usuario: jefe.id_usuario,
        id_alerta: Number(id_alerta),
        tipo: "ALERTA",
        titulo: "Alerta despachada",
        mensaje: `Se despachó la alerta #${id_alerta} a tu institución.`,
      }))
    );
    if (notificacionesData.length > 0) {
      const notificaciones = await this.notificacionRepository.createMany(notificacionesData);
      await Promise.all(notificaciones.map((n) => this.notifier.emitNotificacion(n)));
    }

    return { despachadas: creados.map((envio) => Number(envio.id_institucion)), omitidas: omitidos };
  }
}
