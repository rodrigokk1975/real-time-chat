import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../config/prisma.js";

const app = createApp();

describe("Auth API (/api/auth)", () => {
  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.roomMember.deleteMany();
    await prisma.user.deleteMany();
  });

  it("registers a new user and returns JWT + user DTO", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice Silva",
      email: "alice@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user).toMatchObject({
      name: "Alice Silva",
      email: "alice@example.com",
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "dup@example.com",
      password: "secret123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Alice 2",
      email: "dup@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(409);
  });

  it("logs in with valid credentials and rejects wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
    });

    const ok = await request(app).post("/api/auth/login").send({
      email: "bob@example.com",
      password: "password123",
    });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTypeOf("string");

    const bad = await request(app).post("/api/auth/login").send({
      email: "bob@example.com",
      password: "wrong-password",
    });
    expect(bad.status).toBe(401);
  });

  it("protects /api/auth/me with JWT", async () => {
    const unauth = await request(app).get("/api/auth/me");
    expect(unauth.status).toBe(401);

    const reg = await request(app).post("/api/auth/register").send({
      name: "Carol",
      email: "carol@example.com",
      password: "password123",
    });

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("carol@example.com");
  });
});
