"use client";

import { useEffect, useState, useRef } from "react";
import { getAdminRequests, sendMessage } from "@/lib/api";
import { useAppContext } from "@/app/state/AppContext";
import BackToAdminButton from "@/components/BackToAdminButton";
import PageLoader from "@/components/PageLoader";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const TYPE_LABELS = {
  product_request: "Product Request",
  distributor: "Distributor Application",
};

async function uploadImageToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary not configured.");
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
  if (!res.ok) throw new Error("Image upload failed");
  const result = await res.json();
  return result.secure_url;
}

function UserInfoPanel({ request, onClose }) {
  const purchases = request.userPurchases || [];
  const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-strong)] flex-shrink-0">
        <p className="text-sm font-semibold">User info</p>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] transition text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Identity</p>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {[
              { label: "Name", value: request.userName || "—" },
              { label: "Email", value: request.userEmail || "—" },
              { label: "User ID", value: request.userId || "—" },
              { label: "Member since", value: request.userCreatedAt ? formatDate(request.userCreatedAt) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-sm text-[var(--foreground)] break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">This request</p>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {[
              { label: "Type", value: TYPE_LABELS[request.type] || request.type },
              { label: "Status", value: request.status },
              { label: "Opened", value: formatDate(request.createdAt) },
              { label: "Messages", value: (request.messages || []).length },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Purchase history</p>
            <p className="text-[0.65rem] text-[var(--muted)]">{purchases.length} order{purchases.length !== 1 ? "s" : ""} · {fmt(totalSpent)}</p>
          </div>
          {purchases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-center text-sm text-[var(--muted)]">No purchases on record.</div>
          ) : (
            <div className="space-y-2">
              {purchases.map((p, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-[0.68rem] text-[var(--muted)]">{formatDate(p.createdAt)}</p>
                    <p className="text-sm font-semibold">{fmt(p.total)}</p>
                  </div>
                  <div className="space-y-1">
                    {(p.items || []).map((item, j) => (
                      <div key={j} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[var(--foreground)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--muted)] flex-shrink-0">×{item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {request.allUserRequests && request.allUserRequests.length > 1 && (
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Other requests</p>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
              {request.allUserRequests.filter((r) => r.id !== request.id).map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">{TYPE_LABELS[r.type] || r.type}</p>
                    <p className="text-[0.65rem] text-[var(--muted)]">{formatDate(r.createdAt)}</p>
                  </div>
                  <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminRequestsPage() {
  const { user } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  const fetchRequests = async () => {
    try {
      const data = await getAdminRequests();
      setRequests(data);
      if (data.length > 0 && !active) {
        setActive(data[0]);
      } else if (active) {
        const updated = data.find((r) => r.id === active.id);
        if (updated) setActive(updated);
      }
    } catch (err) {
      console.error("[AdminRequests]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchRequests();
  }, []);

  useEffect(() => {
    if (chatOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length, chatOpen]);

  const handleSelectRequest = (r) => {
    setActive(r);
    setChatOpen(true);
    setUserInfoOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplyImage(file);
    setReplyImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!reply.trim() && !replyImage) return;
    if (!active) return;
    setSending(true);
    try {
      let imageUrl = "";
      if (replyImage) {
        setUploadingImage(true);
        imageUrl = await uploadImageToCloudinary(replyImage);
        setUploadingImage(false);
      }
      await sendMessage(active.id, { from: "admin", text: reply.trim(), imageUrl });
      setReply("");
      setReplyImage(null);
      setReplyImagePreview("");
      await fetchRequests();
    } catch (err) {
      console.error("[AdminRequests] send error:", err);
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="site-frame py-6 sm:py-8 lg:py-10">

      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--foreground)]">Requests inbox</h1>
        </div>
        <BackToAdminButton />
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Attachment" className="w-full rounded-2xl object-contain max-h-[85vh]" />
            <button onClick={() => setLightboxImage(null)} className="absolute -top-3 -right-3 bg-white text-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg">✕</button>
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader text="Loading requests" />
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">No requests yet.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* ── Request list ── */}
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden h-fit max-h-[600px] overflow-y-auto">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRequest(r)}
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

          {/* ── Right panel ── */}
          {active ? (
            <div className="flex flex-col rounded-2xl border border-[var(--border)] overflow-hidden" style={{ maxHeight: "600px" }}>

              {/* Panel header */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 flex-shrink-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{active.userName || active.userEmail}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{active.userEmail} · {TYPE_LABELS[active.type] || active.type}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* User info toggle */}
                  <button
                    onClick={() => { setUserInfoOpen((v) => !v); if (!userInfoOpen) setChatOpen(false); else setChatOpen(true); }}
                    title="User info"
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${userInfoOpen ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--surface-strong)]" : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]"}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </button>
                  {/* Collapse chat chevron */}
                  <button
                    onClick={() => { setChatOpen((v) => !v); setUserInfoOpen(false); }}
                    title={chatOpen ? "Collapse" : "Expand"}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] transition"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                      className={`transition-transform duration-200 ${chatOpen && !userInfoOpen ? "rotate-180" : ""}`}>
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {/* Close */}
                  <button
                    onClick={() => { setActive(null); setChatOpen(true); setUserInfoOpen(false); }}
                    title="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] transition text-xs font-bold"
                  >✕</button>
                </div>
              </div>

              {/* User info panel */}
              {userInfoOpen && (
                <div className="flex-1 overflow-hidden">
                  <UserInfoPanel request={active} onClose={() => { setUserInfoOpen(false); setChatOpen(true); }} />
                </div>
              )}

              {/* Chat */}
              {chatOpen && !userInfoOpen && (
                <>
                  <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {(active.messages || []).map((msg, i) => (
                      <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm space-y-2 ${msg.from === "admin" ? "bg-[var(--foreground)] text-[var(--surface-strong)]" : "bg-[var(--surface)] text-[var(--foreground)]"}`}>
                          {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="attachment" className="rounded-xl max-w-[200px] max-h-[200px] object-cover cursor-pointer" onClick={() => setLightboxImage(msg.imageUrl)} />
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          <p className="text-[0.65rem] opacity-60">{formatDate(msg.sentAt)}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  <div className="border-t border-[var(--border)] p-4 flex-shrink-0 space-y-2">
                    {replyImagePreview && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)]">
                        <img src={replyImagePreview} alt="preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setReplyImage(null); setReplyImagePreview(""); }} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] transition flex-shrink-0" title="Attach image">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </button>
                      <textarea
                        rows={2}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type a reply…"
                        className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base sm:text-sm outline-none transition focus:border-[var(--accent)] resize-none"
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || uploadingImage || (!reply.trim() && !replyImage)}
                        className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-50 self-end flex-shrink-0"
                      >
                        {uploadingImage ? "↑" : sending ? "…" : "Send"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)] min-h-[200px]">
              Select a request to view the conversation
            </div>
          )}
        </div>
      )}

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
    </div>
  );
}