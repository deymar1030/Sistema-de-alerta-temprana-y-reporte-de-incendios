import { Router } from "express";
import { AuthDependencies } from "./dependencies.js";
import { originGuard } from "../../middlewares/originGuard.middleware.js";
import { loginRateLimit } from "../../middlewares/loginRateLimit.middleware.js";

export class AuthRouter {
  static get routes() {
    const router = Router();

    const authController = AuthDependencies.createController();
    const requireAuth = AuthDependencies.createRequireAuth();

    router.use((req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    });

    router.post("/login", originGuard, loginRateLimit, authController.login);
    router.post("/logout", requireAuth, authController.logout);
    router.get("/me", requireAuth, authController.me);
    router.get("/sesiones", requireAuth, authController.listSesiones);
    router.delete("/sesiones/:id", requireAuth, authController.revokeSesion);

    return router;
  }
}
