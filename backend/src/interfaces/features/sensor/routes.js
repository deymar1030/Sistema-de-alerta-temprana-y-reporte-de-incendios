import { Router } from "express";
import { SensorController } from "./controller.js";

const router = Router();

router.post("/", SensorController.create);
router.get("/", SensorController.getAll);
router.get("/:id", SensorController.getById);
router.put("/:id", SensorController.update);
router.delete("/:id", SensorController.delete);

export default router;