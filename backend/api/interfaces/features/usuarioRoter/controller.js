import { UsuarioMapper } from "../../../domain/usuario/mappers/usuario.mapper.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

function forbidden(res) {
  return res.status(403).json({ success: false, error: "No tiene permisos para esta acción", code: "FORBIDDEN" });
}

// El jefe de institucion administra personal, pero solo el OPERATIVO de su
// propia institucion: nunca a otros jefes, administradores ni cuentas de
// otras instituciones. requireRole ya filtra el resto de roles antes de
// llegar aqui (ver routes.js); esto es la frontera ADMIN vs JEFE_INSTITUCION.
function esOperativoDeLaMismaInstitucion(usuario, actor) {
  return usuario?.rol?.nombre_rol === RolNombres.OPERATIVO &&
    String(usuario?.id_institucion) === String(actor?.id_institucion);
}

// Autogestion de "Mi cuenta" (ver frontend/src/services/profile.service.ts):
// cualquier rol puede ver/editar su propia fila, pero update() nunca debe
// dejarle tocar rol, institucion, estado ni contrasena por este camino.
const CAMPOS_AUTOGESTION = ["nombre", "primer_apellido", "segundo_apellido", "correo", "telefono"];

function esSiMismo(req) {
  return String(req.auth?.usuario?.id_usuario) === String(req.params.id);
}

function soloCamposDeAutogestion(usuarioData) {
  return Object.keys(usuarioData).every((campo) => CAMPOS_AUTOGESTION.includes(campo));
}

function mapUsuarioCreateRequest(body) {
  return {
    id_rol: body.id_rol ?? null,
    // Alternativa a id_rol: el use case la resuelve con rolRepository.findOrCreateByNombre.
    nombre_rol: body.nombre_rol,
    id_institucion: body.id_institucion ?? null,
    nombre: body.nombre,
    telefono: body.telefono ?? null,
    contrasena: body.contrasena,
    correo: body.correo,
    primer_apellido: body.primer_apellido ?? null,
    segundo_apellido: body.segundo_apellido ?? null,
  };
}

function mapUsuarioUpdateRequest(body) {
  const campos = ["id_rol", "nombre_rol", "id_institucion", "nombre", "telefono", "primer_apellido", "segundo_apellido", "correo", "contrasena"];

  const data = {};
  for (const campo of campos) {
    // "" se trata como "no enviado": un formulario que no toca un campo
    // opcional no debe vaciarlo silenciosamente.
    if (body[campo] !== undefined && body[campo] !== "") data[campo] = body[campo];
  }

  return data;
}

export class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  create = async (req, res) => {
    try {
      const usuarioData = mapUsuarioCreateRequest(req.body);
      const actor = req.auth?.usuario;

      if (actor?.rol?.nombre_rol === RolNombres.JEFE_INSTITUCION) {
        if (usuarioData.id_rol != null) return forbidden(res);
        if (usuarioData.nombre_rol !== RolNombres.OPERATIVO) return forbidden(res);
        if (String(usuarioData.id_institucion) !== String(actor.id_institucion)) return forbidden(res);
      }

      const result = await this.usuarioService.create(usuarioData, actor?.id_usuario);

      res.status(201).json({
        success: true,
        data: UsuarioMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  list = async (req, res) => {
    try {
      const actor = req.auth?.usuario;
      // El jefe de institucion nunca decide que institucion consulta: se
      // ignora cualquier id_institucion que mande el cliente y se fuerza la
      // suya, para que no pueda listar personal de otra institucion.
      const id_institucion = actor?.rol?.nombre_rol === RolNombres.JEFE_INSTITUCION
        ? actor.id_institucion
        : req.query.id_institucion;

      const usuarios = await this.usuarioService.getAll({
        id_institucion,
        incluirEliminados: req.query.incluirEliminados,
      });

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTOArray(usuarios),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  listOperativos = async (req, res) => {
    try {
      const operativos = await this.usuarioService.getOperativosInstitucion(req.auth.usuario.id_institucion);

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTOArray(operativos),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getById = async (req, res) => {
    try {
      const usuario = await this.usuarioService.getById(req.params.id);
      const actor = req.auth?.usuario;
      const esAdmin = actor?.rol?.nombre_rol === RolNombres.ADMIN;
      const autorizado = esAdmin || esSiMismo(req) ||
        (actor?.rol?.nombre_rol === RolNombres.JEFE_INSTITUCION && esOperativoDeLaMismaInstitucion(usuario, actor));

      if (!autorizado) {
        // 404 en vez de 403: no revela que ese ID existe en otra institucion u otro rol.
        return res.status(404).json({ success: false, error: "Usuario not found" });
      }

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTO(usuario),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  update = async (req, res) => {
    try {
      const usuarioData = mapUsuarioUpdateRequest(req.body);
      const actor = req.auth?.usuario;
      const esAdmin = actor?.rol?.nombre_rol === RolNombres.ADMIN;

      if (!esAdmin) {
        if (esSiMismo(req)) {
          // Autogestion: solo datos de contacto propios, nunca rol, institucion ni contrasena.
          if (!soloCamposDeAutogestion(usuarioData)) return forbidden(res);
        } else if (actor?.rol?.nombre_rol === RolNombres.JEFE_INSTITUCION) {
          const existente = await this.usuarioService.getById(req.params.id);
          if (!esOperativoDeLaMismaInstitucion(existente, actor)) return forbidden(res);
          if (usuarioData.id_rol != null) return forbidden(res);
          if (usuarioData.nombre_rol != null && usuarioData.nombre_rol !== RolNombres.OPERATIVO) return forbidden(res);
          if (usuarioData.id_institucion != null && String(usuarioData.id_institucion) !== String(actor.id_institucion)) return forbidden(res);
        } else {
          return forbidden(res);
        }
      }

      const result = await this.usuarioService.update(req.params.id, usuarioData, actor?.id_usuario);

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  desactivar = async (req, res) => {
    try {
      const actor = req.auth?.usuario;

      if (actor?.rol?.nombre_rol === RolNombres.JEFE_INSTITUCION) {
        const existente = await this.usuarioService.getById(req.params.id);
        if (!esOperativoDeLaMismaInstitucion(existente, actor)) return forbidden(res);
      }

      const result = await this.usuarioService.desactivar(req.params.id, actor?.id_usuario);

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  reactivar = async (req, res) => {
    try {
      const actor = req.auth?.usuario;

      if (actor?.rol?.nombre_rol === RolNombres.JEFE_INSTITUCION) {
        const existente = await this.usuarioService.getById(req.params.id);
        if (!esOperativoDeLaMismaInstitucion(existente, actor)) return forbidden(res);
      }

      const result = await this.usuarioService.reactivar(req.params.id, actor?.id_usuario);

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}
