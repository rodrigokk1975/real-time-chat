import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import type { RoomDTO } from "@chat/shared";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { createRoomsRouter } from "./modules/rooms/rooms.routes.js";

export interface AppDependencies {
  onRoomCreated?: (room: RoomDTO) => void;
}

export function createApp(deps: AppDependencies = {}) {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/rooms", createRoomsRouter(deps.onRoomCreated));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[server] Unhandled error:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  });

  return app;
}
