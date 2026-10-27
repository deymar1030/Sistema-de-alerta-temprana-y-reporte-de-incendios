import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Sistema de Alerta Temprana y Reporte de Incendios - API",
      version: "1.0.0",
      description:
        "Documentacion de los endpoints del backend (Node.js + Express + Prisma + PostgreSQL).",
    },
    servers: [
      {
        url: "/api",
        description: "Servidor principal",
      },
    ],
  },
  apis: [
    "./api/interfaces/docs/**/*.doc.js",
    "./api/interfaces/docs/components/**/*.js",
  ],
});
