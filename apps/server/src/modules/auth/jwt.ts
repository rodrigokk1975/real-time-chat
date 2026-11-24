import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";

export interface AuthTokenPayload {
  sub: string;
  name: string;
  email: string;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded.sub || typeof decoded.name !== "string" || typeof decoded.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return {
    sub: String(decoded.sub),
    name: decoded.name,
    email: decoded.email,
  };
}
