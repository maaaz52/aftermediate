"use client";

import * as React from "react";
import { Loader2, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listSessions,
  createSession,
  deleteSession,
  renameSession,
  type ChatSession,
  type SessionPersona,
} from "@/lib/chat-api";

interface SessionSidebarProps {
  persona: SessionPersona;
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
}

const PERSONA_LABELS: Record<SessionPersona, string> = {
  manzil: "Manzil A.I",
  safar: "Safar A.I",
  study: "Ustaad A.I",
  hunar: "Hunar A.I",
};

export function SessionSidebar({
  persona,
  activeSessionId,
  onSelect,
  onNew,
  open,
  onClose,
}: SessionSidebarProps) {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listSessions(persona)
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch((cause) => {
        console.warn("chat session list failed", cause);
        if (!cancelled) setError("Could not load saved chats.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, persona]);

  async function handleNew() {
    try {
      setError(null);
      const session = await createSession(persona);
      setSessions((prev) => [session, ...prev]);
      onNew();
      onSelect(session.id);
      onClose();
    } catch (cause) {
      console.warn("chat session create failed", cause);
      setError("Could not create a saved chat.");
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) onNew();
    } catch (cause) {
      console.warn("chat session delete failed", cause);
      setError("Could not delete that chat.");
    }
  }

  async function handleRename(id: string) {
    if (!editTitle.trim()) return;
    try {
      setError(null);
      await renameSession(id, editTitle.trim());
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editTitle.trim().slice(0, 80) } : s))
      );
      setEditingId(null);
    } catch (cause) {
      console.warn("chat session rename failed", cause);
      setError("Could not rename that chat.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex h-full w-72 flex-col border-r border-line bg-surface shadow-xl animate-[slideInLeft_0.2s_ease-out]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-ink">{PERSONA_LABELS[persona]}</h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleNew}
          className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </button>

        {error && <p className="mx-3 mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-2 flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-faint" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-faint">
              No chats yet. Start a new one above.
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer",
                  activeSessionId === session.id
                    ? "bg-saffron/10 text-ink"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
                onClick={() => {
                  onSelect(session.id);
                  onClose();
                }}
              >
                {editingId === session.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(session.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-transparent text-sm text-ink outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 truncate">{session.title}</span>
                )}
                <div className="hidden shrink-0 group-hover:flex items-center gap-1">
                  {editingId !== session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditTitle(session.title);
                      }}
                      className="p-1 text-faint hover:text-ink"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                    className="p-1 text-faint hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
