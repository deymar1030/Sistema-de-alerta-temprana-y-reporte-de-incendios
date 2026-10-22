import "dotenv/config";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(parsed) ? parsed : fallback;
};

const NODE_ENV = process.env.NODE_ENV || "development";

const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

export const envs = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  NODE_ENV,

  CORS_ORIGINS: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  TRUST_PROXY: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : null,

  SESSION_TTL_HOURS: toNumber(process.env.SESSION_TTL_HOURS, 8),

  COOKIE_SAMESITE: sameSite,
  // SameSite=None exige Secure; en produccion Secure siempre esta activo.
  COOKIE_SECURE:
    process.env.COOKIE_SECURE !== undefined && process.env.COOKIE_SECURE !== ""
      ? process.env.COOKIE_SECURE === "true"
      : NODE_ENV === "production" || sameSite === "none",

  LOGIN_RATE_LIMIT_MAX: toNumber(process.env.LOGIN_RATE_LIMIT_MAX, 20),

  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
  MQTT_CLIENT_ID: process.env.MQTT_CLIENT_ID || "backend",
  MQTT_USERNAME: process.env.MQTT_USERNAME || "backend",
  MQTT_PASSWORD: process.env.MQTT_PASSWORD || "",
  MQTT_CA_FILE: process.env.MQTT_CA_FILE || "",
  // Alternativa sin archivo: certificado CA en base64 (una sola linea, util para
  // paneles como Coolify donde pegar un PEM multilinea es incomodo/propenso a errores).
  MQTT_CA: process.env.MQTT_CA_BASE64 ? Buffer.from(process.env.MQTT_CA_BASE64, "base64") : undefined,

  // Secreto compartido con Mosquitto para /internal/mqtt/* (va en auth_opt_http_user_agent).
  MQTT_AUTH_SECRET: process.env.MQTT_AUTH_SECRET || "",

  // Microservicio FastAPI de deteccion de incendios por imagen (backend/ml-service).
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  ML_SERVICE_TIMEOUT_MS: toNumber(process.env.ML_SERVICE_TIMEOUT_MS, 15000),

  // Microservicio FastAPI de calculo de rutas (backend/routing-service).
  ROUTING_SERVICE_URL: process.env.ROUTING_SERVICE_URL || "http://127.0.0.1:8001",
  ROUTING_SERVICE_TIMEOUT_MS: toNumber(process.env.ROUTING_SERVICE_TIMEOUT_MS, 15000),
};
