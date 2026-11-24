import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { io as createClient, type Socket } from "socket.io-client";
import type { ClientToServerEvents, MessageDTO, OnlineUserDTO, ServerToClientEvents } from "@chat/shared";
import { createServerBundle } from "../bootstrap.js";
import { prisma } from "../config/prisma.js";

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function connectSocket(url: string, token?: string): Promise<TestSocket> {
  return new Promise((resolve, reject) => {
    const socket: TestSocket = createClient(url, {
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      reconnection: false,
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err) => {
      socket.close();
      reject(err);
    });
  });
}

describe("Socket.IO Server (Auth, Rooms, Messages & Presence)", () => {
  const bundle = createServerBundle();
  let baseUrl = "";
  let aliceToken = "";
  let bobToken = "";
  let roomId = "";

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      bundle.httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = bundle.httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    bundle.io.close();
    await new Promise<void>((resolve) => bundle.httpServer.close(() => resolve()));
  });

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.roomMember.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    const aliceRes = await request(bundle.app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice-ws@example.com",
      password: "password123",
    });
    aliceToken = aliceRes.body.token;

    const bobRes = await request(bundle.app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob-ws@example.com",
      password: "password123",
    });
    bobToken = bobRes.body.token;

    const room = await prisma.room.create({ data: { name: "geral" } });
    roomId = room.id;
  });

  it("rejects WebSocket handshake without JWT or with invalid JWT", async () => {
    await expect(connectSocket(baseUrl)).rejects.toThrow("UNAUTHORIZED");
    await expect(connectSocket(baseUrl, "invalid.jwt.token")).rejects.toThrow("UNAUTHORIZED");
  });

  it("broadcasts persisted messages to room members and tracks multi-tab presence", async () => {
    const aliceTab1 = await connectSocket(baseUrl, aliceToken);
    const aliceTab2 = await connectSocket(baseUrl, aliceToken);
    const bobSocket = await connectSocket(baseUrl, bobToken);

    try {
      await new Promise<void>((resolve) => {
        aliceTab1.emit("room:join", { roomId }, (res) => {
          expect(res.ok).toBe(true);
          resolve();
        });
      });
      await new Promise<void>((resolve) => {
        aliceTab2.emit("room:join", { roomId }, () => resolve());
      });
      await new Promise<void>((resolve) => {
        bobSocket.emit("room:join", { roomId }, (res) => {
          expect(res.ok).toBe(true);
          expect(res.data?.onlineUsers.map((u) => u.name)).toEqual(["Alice", "Bob"]);
          resolve();
        });
      });

      // Alice sends message -> Bob receives via message:new
      const receivedByBob = new Promise<MessageDTO>((resolve) => {
        bobSocket.once("message:new", (msg) => resolve(msg));
      });

      const sendAck = await new Promise<{ ok: boolean; data?: MessageDTO }>((resolve) => {
        aliceTab1.emit("message:send", { roomId, content: "Olá em tempo real!" }, (res) => resolve(res));
      });

      expect(sendAck.ok).toBe(true);
      const msg = await receivedByBob;
      expect(msg.content).toBe("Olá em tempo real!");
      expect(msg.user.name).toBe("Alice");

      // Verify persisted in SQLite
      const dbCount = await prisma.message.count({ where: { roomId } });
      expect(dbCount).toBe(1);

      // Closing Alice tab 1 must keep Alice online because tab 2 is still open
      const presenceAfterTab1 = new Promise<OnlineUserDTO[]>((resolve) => {
        bobSocket.once("presence:update", ({ users }) => resolve(users));
      });
      aliceTab1.disconnect();
      const users1 = await presenceAfterTab1;
      expect(users1.map((u) => u.name)).toEqual(["Alice", "Bob"]);

      // Closing Alice tab 2 removes Alice from presence
      const presenceAfterTab2 = new Promise<OnlineUserDTO[]>((resolve) => {
        bobSocket.once("presence:update", ({ users }) => resolve(users));
      });
      aliceTab2.disconnect();
      const users2 = await presenceAfterTab2;
      expect(users2.map((u) => u.name)).toEqual(["Bob"]);
    } finally {
      aliceTab1.close();
      aliceTab2.close();
      bobSocket.close();
    }
  });
});
