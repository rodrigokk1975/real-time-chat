import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-me-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
};
