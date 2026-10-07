import { UsuarioMapper } from "../../../domain/usuario/mappers/usuario.mapper.js";
import { SesionMapper } from "../../../domain/sesion/mappers/sesion.mapper.js";
import { AuthError } from "../../../domain/auth/errors/authError.js";
import { Validators } from "../../../config/validators.js";
import { SessionCookie } from "../../../config/sessionCookie.js";

function handleError(res, error) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  console.error(error);
  res.status(500).json({ success: false, error: "Error interno del servidor" });
}

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  login = async (req, res) => {
    try {
      const { usuario, token } = await this.authService.login(
        { correo: req.body?.correo, contrasena: req.body?.contrasena },
        SessionCookie.read(req)
      );

      SessionCookie.set(res, token);

      res.json({ success: true, data: UsuarioMapper.toResponseDTO(usuario) });
    } catch (error) {
      handleError(res, error);
    }
  };

  logout = async (req, res) => {
    try {
      await this.authService.logout(req.auth);
      SessionCookie.clear(res);

      res.json({ success: true });
    } catch (error) {
      handleError(res, error);
    }
  };

  me = (req, res) => {
    res.json({ success: true, data: UsuarioMapper.toResponseDTO(req.auth.usuario) });
  };

  listSesiones = async (req, res) => {
    try {
      const sesiones = await this.authService.getSesiones(req.auth.usuario.id_usuario);

      res.json({
        success: true,
        data: SesionMapper.toResponseDTOArray(sesiones, req.auth.sesion.id_sesion),
      });
    } catch (error) {
      handleError(res, error);
    }
  };

  revokeSesion = async (req, res) => {
    try {
      if (!Validators.isValidId(req.params.id)) {
        return res.status(400).json({ success: false, error: "ID not valid", code: "VALIDATION_ERROR" });
      }

      await this.authService.revokeSesion(req.params.id, req.auth.usuario.id_usuario);

      if (Number(req.params.id) === req.auth.sesion.id_sesion) SessionCookie.clear(res);

      res.json({ success: true });
    } catch (error) {
      handleError(res, error);
    }
  };
}
