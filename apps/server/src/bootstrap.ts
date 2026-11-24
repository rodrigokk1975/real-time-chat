import http from "node:http";
import type { RoomDTO } from "@chat/shared";
import { createApp } from "./app.js";
import { createSocketServer, type ChatSocketServer } from "./modules/socket/index.js";

export function createServerBundle() {
  let ioRef: ChatSocketServer | null = null;

  const app = createApp({
    onRoomCreated: (room: RoomDTO) => {
      ioRef?.emit("room:created", room);
    },
  });

  const httpServer = http.createServer(app);
  const { io, presenceManager } = createSocketServer(httpServer);
  ioRef = io;

  return { app, httpServer, io, presenceManager };
}
