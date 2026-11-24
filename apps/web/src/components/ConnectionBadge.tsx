import type { ConnectionStatus } from "../context/SocketContext";

const CONFIG: Record<
  ConnectionStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  connected: {
    label: "Conectado",
    dotClass: "bg-emerald-400",
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  reconnecting: {
    label: "Reconectando",
    dotClass: "bg-amber-400 animate-pulse",
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
  disconnected: {
    label: "Desconectado",
    dotClass: "bg-rose-400",
    badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  },
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const { label, dotClass, badgeClass } = CONFIG[status];
  return (
    <span
      title={`Status WebSocket: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] font-medium ${badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
