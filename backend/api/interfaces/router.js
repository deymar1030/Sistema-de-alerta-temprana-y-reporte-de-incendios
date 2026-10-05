import { Router } from "express";
import SensorRouter from "./features/sensor/routes.js";
import { ZonaGeograficaRouter } from "./features/zonaGeograficaRoter/routes.js";
import { InstitucionRouter } from "./features/institucionRoter/routes.js";
import { UbicacionGeograficaRouter } from "./features/ubicacionGeograficaRoter/routes.js";
import { UsuarioRouter } from "./features/usuarioRoter/routes.js";
import { ReporteURouter } from "./features/reporteURoter/routes.js";
import { NotificacionRouter } from "./features/notificacionRoter/routes.js";
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
    router.use("/sensores", requireAuth, SensorRouter);
    router.use("/instituciones", requireAuth, InstitucionRouter.routes);
    router.use("/ubicaciones-geograficas", requireAuth, UbicacionGeograficaRouter.routes);
    router.use("/usuarios", requireAuth, UsuarioRouter.routes);
    router.use("/reportes-usuario", requireAuth, ReporteURouter.routes);
    router.use("/notificaciones", requireAuth, NotificacionRouter.routes);

    return router;
  }
}
