"use client";

import { useEffect, useState, useRef } from "react";
import { getAdminRequests, sendMessage } from "@/lib/api";
import { useAppContext } from "@/app/state/AppContext";
import BackToAdminButton from "@/components/BackToAdminButton";
import PageLoader from "@/components/PageLoader";
import UserInfoPanel from "./UserInfoPanel";
import ChatPanel from "./ChatPanel";

const TYPE_LABELS = {
  product_request: "Product Request",
  distributor: "Distributor Application",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

/**
 * Robust Cloudinary Upload
 */
async function uploadImageToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary not configured.");
  
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", uploadPreset);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { 
    method: "POST", 
    body: data 
  });
  
  if (!res.ok) throw new Error("Image upload failed");
  const result = await res.json();
  return result.secure_url;
}

export default function AdminRequestsPage() {
  const { user } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [userInfoOpen, setUserInfoOpen] = useState(false);
  
  // Chat Input States
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // Quote logic
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // UI States
  const [lightboxImage, setLightboxImage] = useState(null);
  const bottomRef = useRef(null);

  /**
   * Fetch and Sync Requests
   */
  const fetchRequests = async () => {
    try {
      const data = await getAdminRequests();
      setRequests(data);
      
      if (data.length > 0 && !active) {
        // Auto-select first request on load
        setActive(data[0]);
      } else if (active) {
        // Sync active request with fresh data
        const updated = data.find((r) => r.id === active.id);
        if (updated) setActive(updated);
      }
    } catch (err) {
      console.error("[AdminRequests] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchRequests();
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (chatOpen && !userInfoOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [active?.messages?.length, chatOpen, userInfoOpen]);

  const handleSelectRequest = (r) => {
    setActive(r);
    setChatOpen(true);
    setUserInfoOpen(false);
    // Reset input states when switching chats
    setReply("");
    setReplyImage(null);
    setReplyImagePreview("");
    setReplyingTo(null);
  };

  /**
   * Send Message Logic
   */
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

      await sendMessage(active.id, { 
        from: "admin", 
        text: reply.trim(), 
        imageUrl,
        // Quote logic: passing the parent message data
        replyTo: replyingTo ? {
          text: replyingTo.text,
          imageUrl: replyingTo.imageUrl,
          from: replyingTo.from
        } : null
      });

      // Reset states
      setReply("");
      setReplyImage(null);
      setReplyImagePreview("");
      setReplyingTo(null);
      
      // Refresh to show new message
      await fetchRequests();
    } catch (err) {
      console.error("[AdminRequests] send error:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="site-frame py-6 sm:py-8 lg:py-10">

      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--foreground)]">Requests inbox</h1>
        </div>
        <BackToAdminButton />
      </div>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" 
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Attachment" className="w-full rounded-2xl object-contain max-h-[90vh]" />
            <button 
              onClick={() => setLightboxImage(null)} 
              className="absolute -top-4 -right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-2xl hover:scale-110 transition"
            >✕</button>
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader text="Loading requests" />
      ) : requests.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-[var(--border)] px-5 py-20 text-center">
          <p className="text-sm text-[var(--muted)] italic">No customer requests found.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">

          {/* Sidebar: Request list */}
          <div className="divide-y divide-[var(--border)] rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden h-fit max-h-[700px] overflow-y-auto shadow-sm">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRequest(r)}
                className={`w-full text-left px-5 py-4 transition-all duration-200 ${
                  active?.id === r.id 
                    ? "bg-[var(--surface)] border-l-4 border-[var(--accent)]" 
                    : "hover:bg-[var(--surface)] border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate text-[var(--foreground)]">
                    {r.userName || r.userEmail?.split('@')[0]}
                  </p>
                  <span className={`text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${
                    r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-[0.7rem] font-medium text-[var(--muted)]">{TYPE_LABELS[r.type] || r.type}</p>
                <p className="mt-1 text-[0.6rem] text-[var(--muted)] opacity-50">{formatDate(r.createdAt)}</p>
              </button>
            ))}
          </div>

          {/* Main Content: Chat or User Info */}
          {active ? (
            <div className="flex flex-col rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden shadow-[var(--shadow)]" style={{ height: "700px" }}>

              {/* Chat Header */}
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-strong)] px-6 py-4 flex-shrink-0">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {(active.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate text-[var(--foreground)]">{active.userName || active.userEmail}</p>
                    <p className="text-[0.65rem] text-[var(--muted)] truncate font-medium">
                      {active.userEmail} · {TYPE_LABELS[active.type]}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { 
                      setUserInfoOpen((v) => !v); 
                      if (!userInfoOpen) setChatOpen(false); 
                      else setChatOpen(true); 
                    }}
                    title="User Profile & History"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                      userInfoOpen 
                        ? "bg-[var(--foreground)] border-[var(--foreground)] text-[var(--surface-strong)] shadow-md" 
                        : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => { setActive(null); setChatOpen(true); setUserInfoOpen(false); }}
                    title="Close Panel"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold"
                  >✕</button>
                </div>
              </div>

              {/* Dynamic Panel Content */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {userInfoOpen ? (
                  <UserInfoPanel
                    request={active}
                    onClose={() => { setUserInfoOpen(false); setChatOpen(true); }}
                  />
                ) : chatOpen ? (
                  <ChatPanel
                    messages={active.messages}
                    reply={reply} 
                    setReply={setReply}
                    replyImage={replyImage} 
                    setReplyImage={setReplyImage}
                    replyImagePreview={replyImagePreview} 
                    setReplyImagePreview={setReplyImagePreview}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    sending={sending} 
                    uploadingImage={uploadingImage}
                    onSend={handleSend}
                    onLightbox={setLightboxImage}
                    bottomRef={bottomRef}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-[var(--border)] bg-[var(--surface-strong)]/30 text-center p-12 min-h-[400px]">
              <div className="h-16 w-16 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--muted)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">No Conversation Selected</p>
              <p className="text-xs text-[var(--muted)] mt-1">Select a request from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}