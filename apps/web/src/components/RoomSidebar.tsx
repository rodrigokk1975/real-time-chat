import { useState, type FormEvent } from "react";
import { Hash, Plus, LogOut, MessageSquare, X } from "lucide-react";
import type { RoomDTO, UserDTO } from "@chat/shared";

interface RoomSidebarProps {
  rooms: RoomDTO[];
  activeRoomId: string | null;
  user: UserDTO;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description: string) => Promise<void>;
  onLogout: () => void;
}

export function RoomSidebar({
  rooms,
  activeRoomId,
  user,
  onSelectRoom,
  onCreateRoom,
  onLogout,
}: RoomSidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await onCreateRoom(name, description);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar sala");
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight text-sm">PulseChat</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
          title="Nova sala"
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border-b border-slate-800 bg-slate-950/60 p-3 space-y-2">
          <input
            type="text"
            required
            minLength={2}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nome-da-sala"
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? "Criando..." : "Criar sala"}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Salas ({rooms.length})
        </p>
        <nav className="space-y-0.5">
          {rooms.map((room) => {
            const active = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300 font-medium"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}
              >
                <Hash className="h-4 w-4 shrink-0 opacity-70" />
                <span className="truncate">{room.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-200">{user.name}</p>
          <p className="truncate text-[11px] text-slate-500">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Sair"
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
