import { Router } from "express";
import { createRoomSchema, type MessageDTO, type RoomDTO } from "@chat/shared";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

export function toRoomDTO(room: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count?: { messages: number; members: number };
}): RoomDTO {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    createdAt: room.createdAt.toISOString(),
    ...(room._count ? { _count: room._count } : {}),
  };
}

export function toMessageDTO(msg: {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  createdAt: Date;
  user: { id: string; name: string };
}): MessageDTO {
  return {
    id: msg.id,
    content: msg.content,
    roomId: msg.roomId,
    userId: msg.userId,
    createdAt: msg.createdAt.toISOString(),
    user: {
      id: msg.user.id,
      name: msg.user.name,
    },
  };
}

export function createRoomsRouter(onRoomCreated?: (room: RoomDTO) => void): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (_req, res, next) => {
    try {
      const rooms = await prisma.room.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: { messages: true, members: true },
          },
        },
      });
      res.json({ rooms: rooms.map(toRoomDTO) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const parsed = createRoomSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message ?? "Dados da sala inválidos",
          issues: parsed.error.issues,
        });
        return;
      }

      const name = parsed.data.name.toLowerCase();
      const existing = await prisma.room.findUnique({ where: { name } });
      if (existing) {
        res.status(409).json({ error: "Já existe uma sala com esse nome" });
        return;
      }

      const room = await prisma.room.create({
        data: {
          name,
          description: parsed.data.description || null,
        },
        include: {
          _count: { select: { messages: true, members: true } },
        },
      });

      const dto = toRoomDTO(room);
      onRoomCreated?.(dto);
      res.status(201).json({ room: dto });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:roomId/messages", async (req, res, next) => {
    try {
      const { roomId } = req.params;
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        res.status(404).json({ error: "Sala não encontrada" });
        return;
      }

      const rawLimit = Number(req.query.limit ?? 30);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 30;
      const cursor = typeof req.query.cursor === "string" && req.query.cursor.length > 0 ? req.query.cursor : undefined;

      const rows = await prisma.message.findMany({
        where: { roomId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null;

      res.json({
        messages: pageRows.reverse().map(toMessageDTO),
        nextCursor,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
