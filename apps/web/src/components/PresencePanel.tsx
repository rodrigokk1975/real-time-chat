import { Users } from "lucide-react";
import type { OnlineUserDTO } from "@chat/shared";

interface PresencePanelProps {
  users: OnlineUserDTO[];
  currentUserId: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PresencePanel({ users, currentUserId }: PresencePanelProps) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-l border-slate-800 bg-slate-900/50 lg:flex">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
        <Users className="h-4 w-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Online ({users.length})
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {users.length === 0 ? (
          <li className="text-xs text-slate-500 px-1">Ninguém online ainda</li>
        ) : (
          users.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <li
                key={u.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-200"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-indigo-300">
                  {getInitials(u.name)}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                </div>
                <span className="truncate text-xs">
                  {u.name}
                  {isMe && <span className="ml-1 text-[10px] text-slate-500">(você)</span>}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
