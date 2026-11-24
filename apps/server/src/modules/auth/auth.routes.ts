import { Router } from "express";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema, type UserDTO } from "@chat/shared";
import { prisma } from "../../config/prisma.js";
import { signAccessToken } from "./jwt.js";
import { requireAuth } from "./auth.middleware.js";

function toUserDTO(user: { id: string; name: string; email: string; createdAt: Date }): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Dados de cadastro inválidos",
        issues: parsed.error.issues,
      });
      return;
    }

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "E-mail já cadastrado" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const token = signAccessToken({ sub: user.id, name: user.name, email: user.email });
    res.status(201).json({ token, user: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Credenciais inválidas",
        issues: parsed.error.issues,
      });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "E-mail ou senha incorretos" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "E-mail ou senha incorretos" });
      return;
    }

    const token = signAccessToken({ sub: user.id, name: user.name, email: user.email });
    res.json({ token, user: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
    });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json({ user: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
});
