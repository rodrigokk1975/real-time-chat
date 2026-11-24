import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@chat/shared";
import { useAuth } from "./AuthContext";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface SocketContextValue {
  socket: TypedSocket | null;
  status: ConnectionStatus;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  status: "disconnected",
});

const WS_URL = import.meta.env.VITE_WS_URL ?? undefined;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setStatus("disconnected");
      return;
    }

    setStatus("reconnecting");
    const client: TypedSocket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    client.on("connect", () => setStatus("connected"));
    client.on("disconnect", () => setStatus("reconnecting"));
    client.io.on("reconnect_attempt", () => setStatus("reconnecting"));
    client.on("connect_error", (err) => {
      if (err.message === "UNAUTHORIZED") {
        logout();
        return;
      }
      setStatus("reconnecting");
    });

    setSocket(client);

    return () => {
      client.removeAllListeners();
      client.disconnect();
      setSocket(null);
      setStatus("disconnected");
    };
  }, [token, logout]);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
