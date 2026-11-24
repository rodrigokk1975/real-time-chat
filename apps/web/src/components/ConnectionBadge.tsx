import type { ConnectionStatus } from "../context/SocketContext";

const CONFIG: Record<
  ConnectionStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  connected: {
    label: "Conectado",
    dotClass: "bg-emerald-400",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  reconnecting: {
    label: "Reconectando...",
    dotClass: "bg-amber-400 animate-pulse",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  disconnected: {
    label: "Desconectado",
    dotClass: "bg-rose-400",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const { label, dotClass, badgeClass } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
