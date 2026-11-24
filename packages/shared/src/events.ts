export interface UserDTO {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface OnlineUserDTO {
  id: string;
  name: string;
}

export interface RoomDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: {
    messages: number;
    members: number;
  };
}

export interface MessageDTO {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface SocketAck<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string }, ack?: (res: SocketAck<{ onlineUsers: OnlineUserDTO[] }>) => void) => void;
  "room:leave": (payload: { roomId: string }, ack?: (res: SocketAck) => void) => void;
  "message:send": (payload: { roomId: string; content: string }, ack?: (res: SocketAck<MessageDTO>) => void) => void;
  "typing:start": (payload: { roomId: string }) => void;
  "typing:stop": (payload: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  "message:new": (message: MessageDTO) => void;
  "presence:update": (payload: { roomId: string; users: OnlineUserDTO[] }) => void;
  "typing:update": (payload: { roomId: string; user: OnlineUserDTO; isTyping: boolean }) => void;
  "room:created": (room: RoomDTO) => void;
}
