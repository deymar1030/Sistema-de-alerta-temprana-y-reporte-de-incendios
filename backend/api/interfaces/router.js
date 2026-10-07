import { Router } from "express";
import { SensorRouter } from "./features/sensorRoter/routes.js";
import { ZonaGeograficaRouter } from "./features/zonaGeograficaRoter/routes.js";
import { InstitucionRouter } from "./features/institucionRoter/routes.js";
import { UsuarioRouter } from "./features/usuarioRoter/routes.js";
import { ReporteURouter } from "./features/reporteURoter/routes.js";
import { NotificacionRouter } from "./features/notificacionRoter/routes.js";
import { PredioRouter } from "./features/predioRoter/routes.js";
import { LecturaRouter } from "./features/lecturaRoter/routes.js";
import { AlertaRouter } from "./features/alertaRoter/routes.js";
import { ArchivoRouter } from "./features/archivoRoter/routes.js";
import { InformeAtencionRouter } from "./features/informeAtencionRoter/routes.js";
import { AuthRouter } from "./features/authRoter/routes.js";
import { AuthDependencies } from "./features/authRoter/dependencies.js";

export class AppRouter {
  static get routes() {
    const router = Router();
    const requireAuth = AuthDependencies.createRequireAuth();

    router.get("/health", (req, res) => {
      res.json({
        status: "ok",
        uptime: process.uptime(),
      });
    });

    router.use("/auth", AuthRouter.routes);

    router.use("/zonas-geograficas", requireAuth, ZonaGeograficaRouter.routes);
    router.use("/sensores", requireAuth, SensorRouter.routes);
    router.use("/instituciones", requireAuth, InstitucionRouter.routes);
    router.use("/usuarios", requireAuth, UsuarioRouter.routes);
    router.use("/reportes-usuario", requireAuth, ReporteURouter.routes);
    router.use("/notificaciones", requireAuth, NotificacionRouter.routes);
    router.use("/predios", requireAuth, PredioRouter.routes);
    router.use("/lecturas", requireAuth, LecturaRouter.routes);
    router.use("/alertas", requireAuth, AlertaRouter.routes);
    router.use("/archivos", requireAuth, ArchivoRouter.routes);
    router.use("/informes-atencion", requireAuth, InformeAtencionRouter.routes);

    return router;
  }
}
