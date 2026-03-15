"use client";

import { useEffect, useState, useRef } from "react";
import { getAdminRequests, sendMessage } from "@/lib/api";
import { useAppContext } from "@/app/state/AppContext";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const TYPE_LABELS = {
  product_request: "Product Request",
  distributor: "Distributor Application",
};

export default function AdminRequestsPage() {
  const { user } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchRequests = async () => {
    try {
      const data = await getAdminRequests();
      setRequests(data);
      if (data.length > 0 && !active) setActive(data[0]);
    } catch (err) {
      console.error("[AdminRequests]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active]);

  const handleSend = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await sendMessage(active.id, { from: "admin", text: reply.trim() });
      setReply("");
      await fetchRequests();
      // Re-select active with updated messages
      const updated = await getAdminRequests();
      setActive(updated.find((r) => r.id === active.id) || null);
    } catch (err) {
      console.error("[AdminRequests] send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="site-frame py-6 sm:py-8 lg:py-10">
      <div className="mb-6">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Admin</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--foreground)]">Requests inbox</h1>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">
          No requests yet.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Request list */}
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden h-fit">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => setActive(r)}
                className={`w-full text-left px-4 py-3 transition ${active?.id === r.id ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{r.userName || r.userEmail}</p>
                  <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {r.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{TYPE_LABELS[r.type] || r.type}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)] opacity-60">{formatDate(r.createdAt)}</p>
              </button>
            ))}
          </div>

          {/* Chat panel */}
          {active && (
            <div className="flex flex-col rounded-2xl border border-[var(--border)] overflow-hidden">
              {/* Header */}
              <div className="border-b border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4">
                <p className="text-sm font-semibold">{active.userName || active.userEmail}</p>
                <p className="text-xs text-[var(--muted)]">{active.userEmail} · {TYPE_LABELS[active.type] || active.type}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-5 max-h-[420px]">
                {(active.messages || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.from === "admin" ? "bg-[var(--foreground)] text-[var(--surface-strong)]" : "bg-[var(--surface)] text-[var(--foreground)]"}`}>
                      <p>{msg.text}</p>
                      <p className={`mt-1 text-[0.65rem] opacity-60`}>{formatDate(msg.sentAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-[var(--border)] p-4 flex gap-3">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-50 self-end"
                >
                  {sending ? "…" : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}