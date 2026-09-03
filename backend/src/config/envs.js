import "dotenv/config";

export const envs = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
};
