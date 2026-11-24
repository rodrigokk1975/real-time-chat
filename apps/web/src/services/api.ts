import type {
  CreateRoomInput,
  LoginInput,
  MessageDTO,
  RegisterInput,
  RoomDTO,
  UserDTO,
} from "@chat/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Erro HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  register: (input: RegisterInput) =>
    request<{ token: string; user: UserDTO }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: LoginInput) =>
    request<{ token: string; user: UserDTO }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  me: (token: string) => request<{ user: UserDTO }>("/api/auth/me", {}, token),

  listRooms: (token: string) => request<{ rooms: RoomDTO[] }>("/api/rooms", {}, token),

  createRoom: (token: string, input: CreateRoomInput) =>
    request<{ room: RoomDTO }>(
      "/api/rooms",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token
    ),

  getRoomMessages: (token: string, roomId: string, cursor?: string, limit = 30) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return request<{ messages: MessageDTO[]; nextCursor: string | null }>(
      `/api/rooms/${encodeURIComponent(roomId)}/messages?${params.toString()}`,
      {},
      token
    );
  },
};
