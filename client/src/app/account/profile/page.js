"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackHomeButton from "@/components/BackHomeButton";
import { useAppContext } from "@/app/state/AppContext";
import { getPurchaseHistory } from "@/lib/purchaseHistory";
import { getUserRequests, createRequest, sendMessage } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImage";

const PURCHASES_PER_PAGE = 4;

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const REQUEST_TYPES = [
  { value: "product_request", label: "Request a specific product" },
  { value: "distributor", label: "Become a retail distributor" },
];

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

function ChevronIcon({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAppContext();

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasesOpen, setPurchasesOpen] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageImage, setMessageImage] = useState(null);
  const [messageImagePreview, setMessageImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ type: "product_request", message: "" });
  const [requestImage, setRequestImage] = useState(null);
  const [requestImagePreview, setRequestImagePreview] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");
  const requestFileRef = useRef(null);

  const [lightboxImage, setLightboxImage] = useState(null);

  const totalPurchasePages = Math.ceil(purchases.length / PURCHASES_PER_PAGE);
  const paginatedPurchases = purchases.slice(
    (purchasePage - 1) * PURCHASES_PER_PAGE,
    purchasePage * PURCHASES_PER_PAGE
  );

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const data = await getUserRequests(user);
      setRequests(data);
      if (activeRequest) {
        const updated = data.find((r) => r.id === activeRequest.id);
        if (updated) setActiveRequest(updated);
      }
    } catch (err) {
      console.error("[ProfilePage] requests error:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.isAdmin) { router.replace("/admin/dashboard"); return; }
    setLoadingPurchases(true);
    getPurchaseHistory(user)
      .then(setPurchases)
      .catch((err) => console.error("[ProfilePage] purchases error:", err))
      .finally(() => setLoadingPurchases(false));
    fetchRequests();
  }, [router, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRequest?.messages?.length]);

  const handleRequestImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRequestImage(file);
    setRequestImagePreview(URL.createObjectURL(file));
  };

  const handleMessageImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessageImage(file);
    setMessageImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.message.trim() && !requestImage) return;
    setSubmittingRequest(true);
    try {
      let imageUrl = "";
      if (requestImage) imageUrl = await uploadImageToCloudinary(requestImage);
      await createRequest(user, { ...requestForm, imageUrl });
      setRequestForm({ type: "product_request", message: "" });
      setRequestImage(null);
      setRequestImagePreview("");
      setShowRequestForm(false);
      setRequestStatus("Request sent successfully!");
      fetchRequests();
      setTimeout(() => setRequestStatus(""), 4000);
    } catch (err) {
      setRequestStatus("Failed to send request. Try again.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSendMessage = async (req) => {
    const targetRequest = req || activeRequest;
    if ((!newMessage.trim() && !messageImage) || !targetRequest) return;
    setActiveRequest(targetRequest);
    setSendingMessage(true);
    try {
      let imageUrl = "";
      if (messageImage) {
        setUploadingImage(true);
        imageUrl = await uploadImageToCloudinary(messageImage);
        setUploadingImage(false);
      }
      await sendMessage(targetRequest.id, { from: "user", text: newMessage.trim(), imageUrl });
      setNewMessage("");
      setMessageImage(null);
      setMessageImagePreview("");
      fetchRequests();
    } catch (err) {
      console.error("[ProfilePage] send message error:", err);
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] items-center py-6 sm:py-8">
        <section className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Profile</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--foreground)]">Sign in to view your account</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Your profile and purchase history are available after you sign in.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/account/sign-in?next=/account/profile" className="inline-flex items-center justify-center rounded-full bg-[var(--inverse-bg)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)]">Sign in</Link>
            <Link href="/account/create-account?next=/account/profile" className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">Create account</Link>
          </div>
        </section>
      </main>
    );
  }

  if (user.isAdmin) return null;

  return (
    <main className="site-frame py-6 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6"><BackHomeButton /></div>

      <div className="space-y-4">

        {/* ── Top row: Account info (fixed) + Purchase history (collapsible) side by side on desktop ── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

          {/* Account info — fixed width, never grows */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] lg:w-72 lg:flex-shrink-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Account</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">{user.name}</h1>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Email</p>
                <p className="mt-1.5 text-sm text-[var(--foreground)] truncate">{user.email}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Purchases</p>
                <p className="mt-1.5 text-sm text-[var(--foreground)]">{loadingPurchases ? "—" : purchases.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Requests</p>
                <p className="mt-1.5 text-sm text-[var(--foreground)]">{loadingRequests ? "—" : requests.length}</p>
              </div>
            </div>
          </section>

          {/* Purchase history — collapsible, takes remaining space */}
          <section className="flex-1 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] overflow-hidden">
            <button
              onClick={() => setPurchasesOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-[var(--surface)] transition"
            >
              <div className="text-left">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Purchase history</p>
                <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">
                  Your purchases
                  {!loadingPurchases && purchases.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-[var(--muted)]">({purchases.length})</span>
                  )}
                </p>
              </div>
              <ChevronIcon open={purchasesOpen} />
            </button>

            {purchasesOpen && (
              <div className="px-6 pb-6 border-t border-[var(--border)]">
                <div className="mt-4 space-y-3">
                  {loadingPurchases ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-sm text-[var(--muted)]">Loading…</div>
                  ) : purchases.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-sm text-[var(--muted)]">No purchases yet.</div>
                  ) : (
                    paginatedPurchases.map((purchase) => (
                      <article key={purchase.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="text-[0.68rem] text-[var(--muted)]">{formatDate(purchase.createdAt)}</p>
                          <p className="text-sm font-semibold text-[var(--price)]">{formatPrice(purchase.total)}</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {purchase.items.map((item) => (
                            <button
                              key={`${purchase.id}-${item.slug}`}
                              onClick={() => setLightboxImage(resolveProductImage(item))}
                              className="group flex-shrink-0 flex flex-col items-center gap-1.5 text-center w-16"
                            >
                              <div className="h-14 w-14 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)] transition group-hover:border-[var(--accent)]">
                                <img src={resolveProductImage(item)} alt={item.name} className="h-full w-full object-contain p-1" loading="lazy" />
                              </div>
                              <p className="text-[0.6rem] text-[var(--muted)] leading-tight line-clamp-2 w-full">{item.name}</p>
                              <p className="text-[0.6rem] font-semibold text-[var(--foreground)]">×{item.quantity}</p>
                            </button>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>

                {totalPurchasePages > 1 && (
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <button onClick={() => setPurchasePage((p) => Math.max(1, p - 1))} disabled={purchasePage === 1} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold disabled:opacity-40 transition hover:bg-[var(--surface)]">← Prev</button>
                    <p className="text-xs text-[var(--muted)]">{purchasePage} / {totalPurchasePages}</p>
                    <button onClick={() => setPurchasePage((p) => Math.min(totalPurchasePages, p + 1))} disabled={purchasePage === totalPurchasePages} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold disabled:opacity-40 transition hover:bg-[var(--surface)]">Next →</button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Requests (collapsible) ── */}
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <button
              onClick={() => setRequestsOpen((v) => !v)}
              className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition min-w-0"
            >
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Requests</p>
                <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">
                  Your requests
                  {requests.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-[var(--muted)]">({requests.length})</span>
                  )}
                </p>
              </div>
              <ChevronIcon open={requestsOpen} />
            </button>
            <button
              onClick={() => { setRequestsOpen(true); setShowRequestForm((v) => !v); }}
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--surface-strong)] transition hover:opacity-90 flex-shrink-0"
            >
              {showRequestForm ? "Cancel" : "New request"}
            </button>
          </div>

          {requestsOpen && (
            <div className="px-6 pb-6 border-t border-[var(--border)]">
              {requestStatus && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{requestStatus}</div>
              )}

              {showRequestForm && (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Request type</label>
                    <select
                      value={requestForm.type}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                    >
                      {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Message</label>
                    <textarea
                      rows={3}
                      value={requestForm.message}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder={requestForm.type === "product_request" ? "Describe the watch or product you're looking for…" : "Tell us about your distribution interests…"}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] resize-none"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Attach a photo (optional)</label>
                    <input type="file" accept="image/*" ref={requestFileRef} onChange={handleRequestImageChange} className="hidden" />
                    {requestImagePreview ? (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[var(--border)]">
                        <img src={requestImagePreview} alt="attachment" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setRequestImage(null); setRequestImagePreview(""); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => requestFileRef.current?.click()} className="w-fit rounded-full border border-dashed border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)] hover:bg-[var(--surface-strong)] transition">+ Attach photo</button>
                    )}
                  </div>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submittingRequest || (!requestForm.message.trim() && !requestImage)}
                    className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-50 transition"
                  >
                    {submittingRequest ? "Sending…" : "Send request"}
                  </button>
                </div>
              )}

              <div className="mt-4 space-y-4">
                {loadingRequests ? (
                  <div className="text-sm text-[var(--muted)]">Loading requests…</div>
                ) : requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--muted)]">
                    No requests yet. Use the button above to make one.
                  </div>
                ) : (
                  requests.map((req) => (
                    <article key={req.id} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                            {REQUEST_TYPES.find((t) => t.value === req.type)?.label || req.type}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)] opacity-60">{formatDate(req.createdAt)}</p>
                        </div>
                        <span className={`text-[0.62rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${req.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {(req.messages || []).map((msg, i) => (
                          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm space-y-2 ${msg.from === "user" ? "bg-[var(--foreground)] text-[var(--surface-strong)]" : "bg-[var(--surface-strong)] text-[var(--foreground)]"}`}>
                              {msg.imageUrl && (
                                <img
                                  src={msg.imageUrl}
                                  alt="attachment"
                                  className="rounded-xl max-w-[180px] max-h-[180px] object-cover cursor-pointer"
                                  onClick={() => setLightboxImage(msg.imageUrl)}
                                />
                              )}
                              {msg.text && <p>{msg.text}</p>}
                              <p className="text-[0.65rem] opacity-60">{formatDate(msg.sentAt)}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className="mt-3 space-y-2">
                        {activeRequest?.id === req.id && messageImagePreview && (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)]">
                            <img src={messageImagePreview} alt="attachment" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => { setMessageImage(null); setMessageImagePreview(""); }} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setActiveRequest(req); fileInputRef.current?.click(); }}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-strong)] transition flex-shrink-0"
                            title="Attach image"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </button>
                          <input
                            value={activeRequest?.id === req.id ? newMessage : ""}
                            onChange={(e) => { setActiveRequest(req); setNewMessage(e.target.value); }}
                            onFocus={() => setActiveRequest(req)}
                            placeholder="Reply…"
                            className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(req); } }}
                          />
                          <button
                            onClick={() => handleSendMessage(req)}
                            disabled={sendingMessage || uploadingImage || (!newMessage.trim() && !(activeRequest?.id === req.id && messageImage))}
                            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-50 flex-shrink-0"
                          >
                            {uploadingImage ? "↑" : sendingMessage ? "…" : "Send"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMessageImageChange} className="hidden" />

      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Product" className="w-full rounded-2xl object-contain max-h-[80vh]" />
            <button onClick={() => setLightboxImage(null)} className="absolute -top-3 -right-3 bg-white text-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}