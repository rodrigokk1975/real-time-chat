import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageDTO, OnlineUserDTO, RoomDTO } from "@chat/shared";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { RoomSidebar } from "../components/RoomSidebar";
import { ChatWindow } from "../components/ChatWindow";
import { PresencePanel } from "../components/PresencePanel";

export function ChatPage() {
  const { user, token, logout } = useAuth();
  const { socket, status } = useSocket();

  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserDTO[]>([]);
  const [typingUsers, setTypingUsers] = useState<OnlineUserDTO[]>([]);

  const activeRoomRef = useRef<string | null>(null);
  activeRoomRef.current = activeRoomId;

  // Load initial rooms list
  useEffect(() => {
    if (!token) return;
    api
      .listRooms(token)
      .then((res) => {
        setRooms(res.rooms);
        if (res.rooms.length > 0 && !activeRoomRef.current) {
          setActiveRoomId(res.rooms[0].id);
        }
      })
      .catch(console.error);
  }, [token]);

  // Subscribe to global + active room socket events
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (room: RoomDTO) => {
      setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [...prev, room]));
    };

    const handleNewMessage = (msg: MessageDTO) => {
      if (msg.roomId !== activeRoomRef.current) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    const handlePresenceUpdate = ({
      roomId,
      users,
    }: {
      roomId: string;
      users: OnlineUserDTO[];
    }) => {
      if (roomId !== activeRoomRef.current) return;
      setOnlineUsers(users);
    };

    const handleTypingUpdate = ({
      roomId,
      user: typingUser,
      isTyping,
    }: {
      roomId: string;
      user: OnlineUserDTO;
      isTyping: boolean;
    }) => {
      if (roomId !== activeRoomRef.current) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.some((u) => u.id === typingUser.id) ? prev : [...prev, typingUser];
        }
        return prev.filter((u) => u.id !== typingUser.id);
      });
    };

    socket.on("room:created", handleRoomCreated);
    socket.on("message:new", handleNewMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      socket.off("room:created", handleRoomCreated);
      socket.off("message:new", handleNewMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("typing:update", handleTypingUpdate);
    };
  }, [socket]);

  // Join room, fetch history, and re-join automatically after reconnect
  useEffect(() => {
    if (!token || !activeRoomId) return;

    let cancelled = false;
    setMessages([]);
    setNextCursor(null);
    setTypingUsers([]);
    setOnlineUsers([]);

    api
      .getRoomMessages(token, activeRoomId)
      .then((res) => {
        if (!cancelled) {
          setMessages(res.messages);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(console.error);

    if (!socket) return;

    const joinActiveRoom = () => {
      socket.emit("room:join", { roomId: activeRoomId }, (ack) => {
        if (!cancelled && ack.ok && ack.data) {
          setOnlineUsers(ack.data.onlineUsers);
        }
      });
    };

    if (socket.connected) {
      joinActiveRoom();
    }
    socket.on("connect", joinActiveRoom);

    return () => {
      cancelled = true;
      socket.off("connect", joinActiveRoom);
      socket.emit("room:leave", { roomId: activeRoomId });
    };
  }, [token, socket, activeRoomId]);

  const handleLoadMoreHistory = useCallback(async () => {
    if (!token || !activeRoomId || !nextCursor || loadingHistory) return;
    setLoadingHistory(true);
    try {
      const res = await api.getRoomMessages(token, activeRoomId, nextCursor);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const older = res.messages.filter((m) => !existingIds.has(m.id));
        return [...older, ...prev];
      });
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, activeRoomId, nextCursor, loadingHistory]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!socket || !activeRoomId) {
        throw new Error("Sem conexão com o servidor");
      }
      await new Promise<void>((resolve, reject) => {
        socket.emit("message:send", { roomId: activeRoomId, content }, (ack) => {
          if (ack.ok) resolve();
          else reject(new Error(ack.error ?? "Erro ao enviar mensagem"));
        });
      });
    },
    [socket, activeRoomId]
  );

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      if (!socket || !activeRoomId) return;
      socket.emit(isTyping ? "typing:start" : "typing:stop", { roomId: activeRoomId });
    },
    [socket, activeRoomId]
  );

  if (!user || !token) return null;

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <RoomSidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        user={user}
        onSelectRoom={setActiveRoomId}
        onCreateRoom={async (name, description) => {
          const { room } = await api.createRoom(token, {
            name,
            description: description || undefined,
          });
          setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [...prev, room]));
          setActiveRoomId(room.id);
        }}
        onLogout={logout}
      />

      {activeRoom ? (
        <>
          <ChatWindow
            room={activeRoom}
            messages={messages}
            currentUserId={user.id}
            connectionStatus={status}
            typingUsers={typingUsers}
            hasMoreHistory={Boolean(nextCursor)}
            loadingHistory={loadingHistory}
            onLoadMoreHistory={handleLoadMoreHistory}
            onSendMessage={handleSendMessage}
            onTypingChange={handleTypingChange}
          />
          <PresencePanel users={onlineUsers} currentUserId={user.id} />
        </>
      ) : (
        <main className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Selecione ou crie uma sala para iniciar o chat
        </main>
      )}
    </div>
  );
}
