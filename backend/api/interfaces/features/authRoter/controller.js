import { UsuarioMapper } from "../../../domain/usuario/mappers/usuario.mapper.js";
import { SesionMapper } from "../../../domain/sesion/mappers/sesion.mapper.js";
import { AuthError } from "../../../domain/auth/errors/authError.js";
import { Validators } from "../../../config/validators.js";
import { SessionCookie } from "../../../config/sessionCookie.js";
import { MFA_PENDIENTE_TTL_MS } from "../../../config/mfaPendiente.js";

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
      const { usuario, token, mfa } = await this.authService.login(
        { correo: req.body?.correo, contrasena: req.body?.contrasena },
        SessionCookie.read(req)
      );

      if (mfa) {
        SessionCookie.set(res, token, MFA_PENDIENTE_TTL_MS);
        return res.json({ success: true, data: null, mfa: { estado: mfa } });
      }

      SessionCookie.set(res, token);
      res.json({ success: true, data: UsuarioMapper.toResponseDTO(usuario) });
    } catch (error) {
      handleError(res, error);
    }
  };

  configurarMfa = async (req, res) => {
    try {
      const { secreto, uri } = await this.authService.configurarMfa(req.auth.usuario);
      res.json({ success: true, data: { secreto, uri } });
    } catch (error) {
      handleError(res, error);
    }
  };

  verificarMfa = async (req, res) => {
    try {
      const usuario = await this.authService.verificarMfa(req.auth, req.body?.codigo);

      SessionCookie.set(res, SessionCookie.read(req));
      res.json({ success: true, data: UsuarioMapper.toResponseDTO(usuario) });
    } catch (error) {
      handleError(res, error);
    }
  };

  register = async (req, res) => {
    try {
      const usuario = await this.authService.register({
        nombre: req.body?.nombre,
        primer_apellido: req.body?.primer_apellido,
        segundo_apellido: req.body?.segundo_apellido,
        telefono: req.body?.telefono,
        correo: req.body?.correo,
        contrasena: req.body?.contrasena,
      });

      res.status(201).json({ success: true, data: UsuarioMapper.toResponseDTO(usuario) });
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
