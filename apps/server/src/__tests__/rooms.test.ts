import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../config/prisma.js";

const app = createApp();

describe("Rooms API (/api/rooms)", () => {
  let token = "";
  let userId = "";

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.roomMember.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    const reg = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice-rooms@example.com",
      password: "password123",
    });
    token = reg.body.token;
    userId = reg.body.user.id;
  });

  it("creates and lists rooms, rejecting duplicate names", async () => {
    const createRes = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Backend", description: "Discussões de Node.js" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.room.name).toBe("backend");

    const dupRes = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "backend" });
    expect(dupRes.status).toBe(409);

    const listRes = await request(app)
      .get("/api/rooms")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.rooms).toHaveLength(1);
    expect(listRes.body.rooms[0].name).toBe("backend");
  });

  it("returns cursor-paginated message history in chronological order", async () => {
    const room = await prisma.room.create({ data: { name: "geral" } });

    const baseTime = Date.now() - 10_000;
    for (let i = 1; i <= 5; i++) {
      await prisma.message.create({
        data: {
          content: `Mensagem ${i}`,
          roomId: room.id,
          userId,
          createdAt: new Date(baseTime + i * 1000),
        },
      });
    }

    const page1 = await request(app)
      .get(`/api/rooms/${room.id}/messages?limit=3`)
      .set("Authorization", `Bearer ${token}`);

    expect(page1.status).toBe(200);
    expect(page1.body.messages.map((m: { content: string }) => m.content)).toEqual([
      "Mensagem 3",
      "Mensagem 4",
      "Mensagem 5",
    ]);
    expect(page1.body.nextCursor).toBeTypeOf("string");

    const page2 = await request(app)
      .get(`/api/rooms/${room.id}/messages?limit=3&cursor=${page1.body.nextCursor}`)
      .set("Authorization", `Bearer ${token}`);

    expect(page2.status).toBe(200);
    expect(page2.body.messages.map((m: { content: string }) => m.content)).toEqual([
      "Mensagem 1",
      "Mensagem 2",
    ]);
    expect(page2.body.nextCursor).toBeNull();
  });

  it("returns 404 for messages of a non-existent room", async () => {
    const res = await request(app)
      .get("/api/rooms/nonexistent-id/messages")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
