import { useEffect, useRef, useState, type FormEvent } from "react";
import { Hash, Send, Loader2, Menu, Users, ArrowUp } from "lucide-react";
import type { MessageDTO, OnlineUserDTO, RoomDTO } from "@chat/shared";
import type { ConnectionStatus } from "../context/SocketContext";
import { ConnectionBadge } from "./ConnectionBadge";
import { getAvatarTone, getInitials } from "../utils/avatar";

interface ChatWindowProps {
  room: RoomDTO;
  messages: MessageDTO[];
  currentUserId: string;
  connectionStatus: ConnectionStatus;
  onlineCount: number;
  typingUsers: OnlineUserDTO[];
  hasMoreHistory: boolean;
  loadingHistory: boolean;
  onOpenRoomsMobile: () => void;
  onOpenPresenceMobile: () => void;
  onLoadMoreHistory: () => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onTypingChange: (isTyping: boolean) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const todayKey = getDayKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = getDayKey(yesterday.toISOString());

  const targetKey = getDayKey(iso);
  if (targetKey === todayKey) return "Hoje";
  if (targetKey === yesterdayKey) return "Ontem";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isGroupedWithPrev(prev: MessageDTO | undefined, curr: MessageDTO): boolean {
  if (!prev) return false;
  if (prev.userId !== curr.userId) return false;
  if (getDayKey(prev.createdAt) !== getDayKey(curr.createdAt)) return false;
  const diffMs = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diffMs < 5 * 60 * 1000;
}

export function ChatWindow({
  room,
  messages,
  currentUserId,
  connectionStatus,
  onlineCount,
  typingUsers,
  hasMoreHistory,
  loadingHistory,
  onOpenRoomsMobile,
  onOpenPresenceMobile,
  onLoadMoreHistory,
  onSendMessage,
  onTypingChange,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room.id]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) {
        onTypingChange(false);
        isTypingRef.current = false;
      }
    };
  }, [room.id, onTypingChange]);

  function handleTextChange(value: string) {
    setText(value);
    if (!isTypingRef.current && value.trim().length > 0) {
      isTypingRef.current = true;
      onTypingChange(true);
    }
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange(false);
      }
    }, 1500);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSendError(null);
    setSending(true);
    try {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange(false);
      }
      await onSendMessage(content);
      setText("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  const othersTyping = typingUsers.filter((u) => u.id !== currentUserId);
  const typingText =
    othersTyping.length === 1
      ? `${othersTyping[0].name} está digitando`
      : othersTyping.length > 1
        ? `${othersTyping.map((u) => u.name).join(", ")} estão digitando`
        : null;

  return (
    <section className="flex flex-1 flex-col min-w-0 bg-[#0B0C0E]">
      {/* Room top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0D0F12]/90 px-4 backdrop-blur">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenRoomsMobile}
            aria-label="Abrir canais"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-emerald-400 shrink-0" />
              <h1 className="truncate font-mono text-sm font-semibold text-white">
                {room.name}
              </h1>
            </div>
            {room.description && (
              <p className="truncate text-[11px] text-zinc-500">{room.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ConnectionBadge status={connectionStatus} />
          <button
            type="button"
            onClick={onOpenPresenceMobile}
            aria-label="Ver usuários online"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-zinc-300 hover:bg-white/[0.07] lg:hidden"
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">{onlineCount}</span>
          </button>
        </div>
      </header>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {hasMoreHistory && (
          <div className="flex justify-center pb-5">
            <button
              type="button"
              disabled={loadingHistory}
              onClick={onLoadMoreHistory}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#14171C] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/15 hover:text-white disabled:opacity-50"
            >
              {loadingHistory ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
              Carregar mensagens anteriores
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14171C] text-emerald-400 mb-3">
              <Hash className="h-5 w-5" />
            </div>
            <h2 className="font-mono text-sm font-semibold text-zinc-200">
              Bem-vindo a #{room.name}
            </h2>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
              {room.description ||
                "Este é o início do histórico desta sala. Envie a primeira mensagem abaixo."}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            {messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showDayDivider =
                !prev || getDayKey(prev.createdAt) !== getDayKey(msg.createdAt);
              const grouped = isGroupedWithPrev(prev, msg);
              const isOwn = msg.userId === currentUserId;

              return (
                <div key={msg.id}>
                  {showDayDivider && (
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <span className="rounded-full border border-white/[0.07] bg-[#111317] px-2.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500">
                        {formatDayLabel(msg.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                  )}

                  <article
                    className={`group animate-msg-in flex items-start gap-3 rounded-lg px-2 transition hover:bg-white/[0.025] ${
                      grouped ? "py-0.5" : "pt-2.5 pb-1"
                    }`}
                  >
                    {grouped ? (
                      <div className="w-8 shrink-0 pt-0.5 text-right font-mono text-[10px] text-zinc-600 opacity-0 transition group-hover:opacity-100 select-none">
                        {formatTime(msg.createdAt)}
                      </div>
                    ) : (
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${getAvatarTone(
                          msg.userId
                        )}`}
                      >
                        {getInitials(msg.user.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className={`text-[13px] font-semibold ${
                              isOwn ? "text-emerald-300" : "text-zinc-100"
                            }`}
                          >
                            {msg.user.name}
                          </span>
                          {isOwn && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-px font-mono text-[9.5px] text-emerald-400">
                              você
                            </span>
                          )}
                          <time className="font-mono text-[10.5px] text-zinc-500">
                            {formatTime(msg.createdAt)}
                          </time>
                        </div>
                      )}
                      <p className="text-[13.5px] leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-white/[0.07] bg-[#0D0F12] px-4 sm:px-6 pt-2 pb-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex h-5 items-center mb-1">
            {typingText ? (
              <div className="inline-flex items-center gap-2 text-[11px] text-emerald-400">
                <span className="inline-flex gap-0.5">
                  <span className="typing-dot h-1 w-1 rounded-full bg-emerald-400" />
                  <span className="typing-dot h-1 w-1 rounded-full bg-emerald-400" />
                  <span className="typing-dot h-1 w-1 rounded-full bg-emerald-400" />
                </span>
                <span>{typingText}</span>
              </div>
            ) : sendError ? (
              <p className="text-[11px] text-rose-400">{sendError}</p>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-[#14171C] p-1.5 transition focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/15"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                connectionStatus === "connected"
                  ? `Enviar mensagem em #${room.name}...`
                  : "Reconectando ao servidor..."
              }
              maxLength={2000}
              disabled={connectionStatus !== "connected"}
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
            {text.length > 1600 && (
              <span className="font-mono text-[10px] text-zinc-500 pr-1">
                {text.length}/2000
              </span>
            )}
            <button
              type="submit"
              disabled={sending || !text.trim() || connectionStatus !== "connected"}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500"
              title="Enviar mensagem (Enter)"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
