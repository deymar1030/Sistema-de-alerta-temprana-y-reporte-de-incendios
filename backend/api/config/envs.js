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
  SESSION_IDLE_MINUTES: toNumber(process.env.SESSION_IDLE_MINUTES, 30),

  COOKIE_SAMESITE: sameSite,
  // SameSite=None exige Secure; en produccion Secure siempre esta activo.
  COOKIE_SECURE:
    process.env.COOKIE_SECURE !== undefined && process.env.COOKIE_SECURE !== ""
      ? process.env.COOKIE_SECURE === "true"
      : NODE_ENV === "production" || sameSite === "none",

  LOGIN_MAX_ATTEMPTS: toNumber(process.env.LOGIN_MAX_ATTEMPTS, 5),
  LOGIN_LOCK_MINUTES: toNumber(process.env.LOGIN_LOCK_MINUTES, 15),
  LOGIN_RATE_LIMIT_MAX: toNumber(process.env.LOGIN_RATE_LIMIT_MAX, 20),

  // Broker Mosquitto (ver docs/TopicosMQTT.md). Solo autenticacion por
  // usuario/contrasena, sin ACL por topico (decision de equipo).
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
  MQTT_CLIENT_ID: process.env.MQTT_CLIENT_ID || "backend",
  MQTT_USERNAME: process.env.MQTT_USERNAME || "backend",
  MQTT_PASSWORD: process.env.MQTT_PASSWORD || "",
};
