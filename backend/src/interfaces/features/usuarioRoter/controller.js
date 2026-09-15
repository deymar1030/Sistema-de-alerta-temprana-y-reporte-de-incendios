import { UsuarioMapper } from "../../../domain/usuario/mappers/usuario.mapper.js";

function mapUsuarioRequest(body) {
  return {
    id_rol: body.id_rol ?? null,
    id_institucion: body.id_institucion ?? null,
    nombre: body.nombre,
    telefono: body.telefono ?? null,
    multiF_S: body.multiF_S ?? null,
    multiF_A: body.multiF_A ?? null,
    contrasena: body.contrasena,
    correo: body.correo,
    primer_apellido: body.primer_apellido ?? null,
    segundo_apellido: body.segundo_apellido ?? null,
  };
}

export class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  create = async (req, res) => {
    try {
      const usuarioData = mapUsuarioRequest(req.body);

      const result = await this.usuarioService.create(usuarioData);

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
      const usuarios = await this.usuarioService.getAll();

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

  getById = async (req, res) => {
    try {
      const usuario = await this.usuarioService.getById(req.params.id);

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
      const usuarioData = mapUsuarioRequest(req.body);

      const result = await this.usuarioService.update(
        req.params.id,
        usuarioData
      );

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

  remove = async (req, res) => {
    try {
      const usuario = await this.usuarioService.delete(req.params.id);

      res.json({
        success: true,
        data: UsuarioMapper.toResponseDTO(usuario),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}
