import "dotenv/config";

export const envs = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  MAX_IMAGE_SIZE_MB: process.env.MAX_IMAGE_SIZE_MB
    ? Number(process.env.MAX_IMAGE_SIZE_MB)
    : 10,
};
