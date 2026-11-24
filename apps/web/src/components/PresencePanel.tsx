import { Users, X } from "lucide-react";
import type { OnlineUserDTO } from "@chat/shared";
import { getAvatarTone, getInitials } from "../utils/avatar";

interface PresencePanelProps {
  users: OnlineUserDTO[];
  currentUserId: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function PresencePanel({
  users,
  currentUserId,
  mobileOpen,
  onCloseMobile,
}: PresencePanelProps) {
  const panelContent = (
    <aside className="flex h-full w-60 shrink-0 flex-col border-l border-white/[0.07] bg-[#111317]">
      <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Online
          </h2>
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-300">
            {users.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar painel de presença"
          className="rounded-md p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto p-3 space-y-1">
        {users.length === 0 ? (
          <li className="px-2 py-4 text-center text-xs text-zinc-600">
            Ninguém online nesta sala
          </li>
        ) : (
          users.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <li
                key={u.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-white/[0.04]"
              >
                <div className="relative shrink-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ${getAvatarTone(
                      u.id
                    )}`}
                  >
                    {getInitials(u.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111317] bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-200">
                    {u.name}
                    {isMe && (
                      <span className="ml-1.5 font-normal text-[10px] text-zinc-500">
                        você
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex h-full">{panelContent}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">{panelContent}</div>
        </div>
      )}
    </>
  );
}
