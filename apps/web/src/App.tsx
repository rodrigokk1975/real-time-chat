import { useEffect, useState } from "react";
import type { RoomDTO } from "@chat/shared";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { RoomSidebar } from "./components/RoomSidebar";
import { api } from "./services/api";

function WorkspaceShell() {
  const { user, token, loading, logout } = useAuth();
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .listRooms(token)
      .then((res) => {
        setRooms(res.rooms);
        if (res.rooms.length > 0 && !activeRoomId) {
          setActiveRoomId(res.rooms[0].id);
        }
      })
      .catch(console.error);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Validando sessão...
      </div>
    );
  }

  if (!user || !token) {
    return <AuthPage />;
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
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
      <main className="flex flex-1 items-center justify-center text-sm text-slate-400">
        {activeRoom ? `Sala selecionada: #${activeRoom.name}` : "Selecione ou crie uma sala"}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}
