import { Router } from "express";
import { AuditoriaDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

// Solo lectura, a proposito: `auditoria`/`auditoriau` las escriben triggers de
// BD a cargo de seguridad; el backend/frontend nunca inserta ni modifica
// filas aca. No agregar POST/PUT/PATCH/DELETE a este router.
export class AuditoriaRouter {
  static get routes() {
    const router = Router();

    const auditoriaController = AuditoriaDependencies.createController();
    const soloAuditor = requireRole(RolNombres.AUDITOR);

    router.get("/", soloAuditor, auditoriaController.list);
    router.get("/usuarios", soloAuditor, auditoriaController.listUsuario);

    return router;
  }
}
