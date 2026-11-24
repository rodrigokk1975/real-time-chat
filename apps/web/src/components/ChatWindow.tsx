import { useEffect, useRef, useState, type FormEvent } from "react";
import { Hash, Send, Loader2 } from "lucide-react";
import type { MessageDTO, OnlineUserDTO, RoomDTO } from "@chat/shared";
import type { ConnectionStatus } from "../context/SocketContext";
import { ConnectionBadge } from "./ConnectionBadge";

interface ChatWindowProps {
  room: RoomDTO;
  messages: MessageDTO[];
  currentUserId: string;
  connectionStatus: ConnectionStatus;
  typingUsers: OnlineUserDTO[];
  hasMoreHistory: boolean;
  loadingHistory: boolean;
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

export function ChatWindow({
  room,
  messages,
  currentUserId,
  connectionStatus,
  typingUsers,
  hasMoreHistory,
  loadingHistory,
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
      ? `${othersTyping[0].name} está digitando...`
      : othersTyping.length > 1
        ? `${othersTyping.map((u) => u.name).join(", ")} estão digitando...`
        : null;

  return (
    <section className="flex flex-1 flex-col min-w-0 bg-slate-950">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Hash className="h-4 w-4 text-indigo-400 shrink-0" />
            <h1 className="truncate text-sm font-semibold text-slate-100">{room.name}</h1>
          </div>
          {room.description && (
            <p className="truncate text-xs text-slate-400 mt-0.5">{room.description}</p>
          )}
        </div>
        <ConnectionBadge status={connectionStatus} />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {hasMoreHistory && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              disabled={loadingHistory}
              onClick={onLoadMoreHistory}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-50"
            >
              {loadingHistory && <Loader2 className="h-3 w-3 animate-spin" />}
              Carregar mensagens anteriores
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Nenhuma mensagem ainda em #{room.name}. Comece a conversa!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div className="flex items-baseline gap-2 px-1 mb-1">
                  <span className="text-xs font-medium text-slate-300">
                    {isOwn ? "Você" : msg.user.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
                    isOwn
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 px-5 py-3">
        <div className="h-4 mb-1">
          {typingText && (
            <p className="text-[11px] text-indigo-400 animate-pulse">{typingText}</p>
          )}
          {!typingText && sendError && (
            <p className="text-[11px] text-rose-400">{sendError}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Mensagem em #${room.name}...`}
            maxLength={2000}
            disabled={connectionStatus !== "connected"}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !text.trim() || connectionStatus !== "connected"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
            title="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
