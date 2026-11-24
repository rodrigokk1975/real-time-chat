import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import {
  sendMessageSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@chat/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { verifyAccessToken, type AuthTokenPayload } from "../auth/jwt.js";
import { toMessageDTO } from "../rooms/rooms.routes.js";
import { PresenceManager } from "./presenceManager.js";

interface SocketData {
  user: AuthTokenPayload;
}

export type ChatSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function createSocketServer(httpServer: HttpServer) {
  const presenceManager = new PresenceManager();

  const io: ChatSocketServer = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const authToken =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : undefined;

    const headerAuth = socket.handshake.headers.authorization;
    const bearerToken =
      typeof headerAuth === "string" && headerAuth.startsWith("Bearer ")
        ? headerAuth.slice("Bearer ".length).trim()
        : undefined;

    const token = authToken ?? bearerToken;
    if (!token) {
      next(new Error("UNAUTHORIZED"));
      return;
    }

    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const onlineUser = { id: user.sub, name: user.name };
    presenceManager.registerSocket(onlineUser, socket.id);

    socket.on("room:join", async ({ roomId }, ack) => {
      try {
        if (!roomId) {
          ack?.({ ok: false, error: "roomId é obrigatório" });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
          ack?.({ ok: false, error: "Sala não encontrada" });
          return;
        }

        await socket.join(roomId);

        await prisma.roomMember.upsert({
          where: { userId_roomId: { userId: user.sub, roomId } },
          update: {},
          create: { userId: user.sub, roomId },
        });

        const onlineUsers = presenceManager.joinRoom(roomId, onlineUser, socket.id);
        io.to(roomId).emit("presence:update", { roomId, users: onlineUsers });
        ack?.({ ok: true, data: { onlineUsers } });
      } catch (err) {
        console.error("[ws] room:join error:", err);
        ack?.({ ok: false, error: "Falha ao entrar na sala" });
      }
    });

    socket.on("room:leave", async ({ roomId }, ack) => {
      try {
        await socket.leave(roomId);
        const onlineUsers = presenceManager.leaveRoom(roomId, user.sub, socket.id);
        socket.to(roomId).emit("typing:update", { roomId, user: onlineUser, isTyping: false });
        io.to(roomId).emit("presence:update", { roomId, users: onlineUsers });
        ack?.({ ok: true });
      } catch (err) {
        console.error("[ws] room:leave error:", err);
        ack?.({ ok: false, error: "Falha ao sair da sala" });
      }
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const parsed = sendMessageSchema.safeParse(payload);
        if (!parsed.success) {
          ack?.({
            ok: false,
            error: parsed.error.issues[0]?.message ?? "Mensagem inválida",
          });
          return;
        }

        const { roomId, content } = parsed.data;
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
          ack?.({ ok: false, error: "Sala não encontrada" });
          return;
        }

        const message = await prisma.message.create({
          data: {
            content,
            roomId,
            userId: user.sub,
          },
          include: {
            user: { select: { id: true, name: true } },
          },
        });

        const dto = toMessageDTO(message);
        io.to(roomId).emit("message:new", dto);
        ack?.({ ok: true, data: dto });
      } catch (err) {
        console.error("[ws] message:send error:", err);
        ack?.({ ok: false, error: "Falha ao enviar mensagem" });
      }
    });

    socket.on("typing:start", ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit("typing:update", { roomId, user: onlineUser, isTyping: true });
    });

    socket.on("typing:stop", ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit("typing:update", { roomId, user: onlineUser, isTyping: false });
    });

    socket.on("disconnect", () => {
      const affectedRooms = presenceManager.disconnectSocket(user.sub, socket.id);
      for (const roomId of affectedRooms) {
        io.to(roomId).emit("typing:update", { roomId, user: onlineUser, isTyping: false });
        io.to(roomId).emit("presence:update", {
          roomId,
          users: presenceManager.getRoomUsers(roomId),
        });
      }
    });
  });

  return { io, presenceManager };
}
