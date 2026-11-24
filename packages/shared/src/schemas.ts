import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(50),
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome da sala deve ter pelo menos 2 caracteres")
    .max(40)
    .regex(/^[a-zA-Z0-9À-ÿ _-]+$/, "Nome da sala contém caracteres inválidos"),
  description: z.string().trim().max(160).optional(),
});

export const sendMessageSchema = z.object({
  roomId: z.string().min(1),
  content: z.string().trim().min(1, "Mensagem não pode ser vazia").max(2000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
