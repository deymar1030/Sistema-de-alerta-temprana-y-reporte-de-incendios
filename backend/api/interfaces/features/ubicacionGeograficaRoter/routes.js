import { Router } from "express";
import { UbicacionGeograficaDependencies } from "./dependencies.js";

const controller = UbicacionGeograficaDependencies.createController();
const router = Router();

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export const UbicacionGeograficaRouter = { routes: router };