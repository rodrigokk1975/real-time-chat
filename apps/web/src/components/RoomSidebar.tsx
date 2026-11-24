import { useMemo, useState, type FormEvent } from "react";
import { Hash, Plus, LogOut, Radio, X, Search } from "lucide-react";
import type { RoomDTO, UserDTO } from "@chat/shared";
import { getAvatarTone, getInitials } from "../utils/avatar";

interface RoomSidebarProps {
  rooms: RoomDTO[];
  activeRoomId: string | null;
  user: UserDTO;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description: string) => Promise<void>;
  onLogout: () => void;
}

export function RoomSidebar({
  rooms,
  activeRoomId,
  user,
  mobileOpen,
  onCloseMobile,
  onSelectRoom,
  onCreateRoom,
  onLogout,
}: RoomSidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false)
    );
  }, [rooms, query]);

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

  const sidebarContent = (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#111317]">
      {/* Brand header */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Radio className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">PulseChat</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
            }}
            title={showForm ? "Cancelar" : "Criar nova sala"}
            className={`rounded-md p-1.5 transition ${
              showForm
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
            }`}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create room form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border-b border-white/[0.07] bg-[#0B0C0E]/70 p-3 space-y-2"
        >
          <p className="text-[11px] font-medium text-zinc-300">Nova sala</p>
          <input
            type="text"
            required
            minLength={2}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex.: frontend"
            className="w-full rounded-md border border-white/[0.09] bg-[#14171C] px-2.5 py-1.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/70 focus:outline-none"
          />
          <input
            type="text"
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição curta (opcional)"
            className="w-full rounded-md border border-white/[0.09] bg-[#14171C] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/70 focus:outline-none"
          />
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-md bg-emerald-600 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {creating ? "Criando..." : "Criar sala"}
          </button>
        </form>
      )}

      {/* Room search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar salas..."
            className="w-full rounded-md border border-white/[0.06] bg-[#0B0C0E]/60 py-1.5 pl-8 pr-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-white/15 focus:outline-none"
          />
        </div>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Canais
          </span>
          <span className="font-mono text-[10px] text-zinc-600">{filteredRooms.length}</span>
        </div>

        <nav className="space-y-0.5" aria-label="Lista de salas">
          {filteredRooms.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-zinc-600">
              Nenhuma sala encontrada
            </p>
          ) : (
            filteredRooms.map((room) => {
              const active = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    onSelectRoom(room.id);
                    onCloseMobile();
                  }}
                  title={room.description ?? `#${room.name}`}
                  className={`group relative flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition ${
                    active
                      ? "bg-white/[0.07] text-white font-medium"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-400" />
                  )}
                  <Hash
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  />
                  <span className="truncate font-mono text-[12.5px]">{room.name}</span>
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Current user footer */}
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] bg-[#0E1014] px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold ${getAvatarTone(
                user.id
              )}`}
            >
              {getInitials(user.name)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0E1014] bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-100">{user.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Sair da conta"
          aria-label="Sair da conta"
          className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-full">{sidebarContent}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
