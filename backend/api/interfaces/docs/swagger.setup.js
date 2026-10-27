import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.config.js";

export function setupSwagger(app) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
}
