"use client";

import { useEffect, useState, useRef } from "react";
import { getAdminRequests, sendMessage, deleteMessage, deleteRequest } from "@/lib/api";
import { useAppContext } from "@/app/state/AppContext";
import BackToAdminButton from "@/components/BackToAdminButton";
import PageLoader from "@/components/PageLoader";
import ConfirmModal from "@/components/ConfirmModal";
import UserInfoPanel from "./UserInfoPanel";
import ChatPanel from "./ChatPanel";

// Firestore imports for status updates
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TYPE_LABELS = {
  product_request: "Product Request",
  distributor: "Distributor Application",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function uploadImageToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary not configured.");

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: data,
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
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Modal State
  const [modal, setModal] = useState({ 
    open: false, 
    type: null, 
    data: null, 
    requestId: null, 
    title: "", 
    message: "" 
  });

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
        else setActive(null);
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

  useEffect(() => {
    if (chatOpen && !userInfoOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [active?.messages?.length, chatOpen, userInfoOpen]);

  /**
   * Selection Handler: Sets active chat AND clears the admin notification badge
   */
  const handleSelectRequest = async (r) => {
    setActive(r);
    setChatOpen(true);
    setUserInfoOpen(false);
    setReply("");
    setReplyImage(null);
    setReplyImagePreview("");
    setReplyingTo(null);

    if (r.status === "open") {
      try {
        const ref = doc(db, "requests", r.id);
        await updateDoc(ref, { status: "answered" });
        
        // Update local state immediately so layout badge updates
        setRequests(prev => prev.map(req => 
          req.id === r.id ? { ...req, status: "answered" } : req
        ));
      } catch (err) {
        console.error("Failed to update request status:", err);
      }
    }
  };

  /**
   * Sending Logic: Includes fix for the arrayUnion 'undefined' error
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

      // Build payload carefully to avoid passing 'undefined' to Firebase
      const messagePayload = {
        from: "admin",
        text: reply.trim(),
        imageUrl: imageUrl || "",
      };

      if (replyingTo) {
        messagePayload.replyTo = {
          text: replyingTo.text || "",
          imageUrl: replyingTo.imageUrl || "",
          from: replyingTo.from
        };
      }

      await sendMessage(active.id, messagePayload);

      setReply("");
      setReplyImage(null);
      setReplyImagePreview("");
      setReplyingTo(null);
      await fetchRequests();
    } catch (err) {
      console.error("[AdminRequests] send error:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  /**
   * Delete Trigger: Individual message (Only your own)
   */
  const triggerDeleteMessage = (msg) => {
    setModal({
      open: true,
      type: "message",
      data: msg,
      requestId: active.id,
      title: "Delete message?",
      message: "This message will be removed from the conversation history.",
    });
  };

  /**
   * Delete Trigger: Whole chat
   */
  const triggerDeleteChat = () => {
    if (!active) return;
    setModal({
      open: true,
      type: "chat",
      requestId: active.id,
      title: "Delete conversation?",
      message: "This will permanently remove this entire request and all messages. This cannot be undone.",
    });
  };

  const onConfirmModal = async () => {
    const { type, requestId, data } = modal;
    setModal({ ...modal, open: false });
    setLoading(true);
    try {
      if (type === "message") {
        await deleteMessage(requestId, data);
      } else if (type === "chat") {
        await deleteRequest(requestId);
        setActive(null);
      }
      await fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="site-frame py-6 sm:py-8 lg:py-10">
      
      {/* Header with Back Button */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--foreground)]">Requests inbox</h1>
        </div>
        <BackToAdminButton />
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} className="w-full rounded-2xl object-contain max-h-[90vh]" alt="Lightbox" />
            <button onClick={() => setLightboxImage(null)} className="absolute -top-4 -right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-2xl">✕</button>
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader text="Processing" />
      ) : requests.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-[var(--border)] px-5 py-20 text-center">
          <p className="text-sm text-[var(--muted)] italic">No customer requests found.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
          
          {/* Sidebar */}
          <div className="divide-y divide-[var(--border)] rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden max-h-[700px] overflow-y-auto shadow-sm">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRequest(r)}
                className={`w-full text-left px-5 py-4 transition ${active?.id === r.id ? "bg-[var(--surface)] border-l-4 border-[var(--accent)]" : "hover:bg-[var(--surface)] border-l-4 border-transparent"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold truncate">{r.userName || r.userEmail?.split("@")[0]}</p>
                  <span className={`text-[0.55rem] font-black uppercase px-2 py-0.5 rounded-full ${r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{r.status}</span>
                </div>
                <p className="text-[0.7rem] text-[var(--muted)]">{TYPE_LABELS[r.type] || r.type}</p>
                <p className="text-[0.6rem] opacity-50">{formatDate(r.createdAt)}</p>
              </button>
            ))}
          </div>

          {/* Main Chat Area */}
          {active && (
            <div className="flex flex-col rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden shadow-[var(--shadow)]" style={{ height: "700px" }}>
              
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">{(active.userName || "U").charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="font-bold">{active.userName || active.userEmail}</p>
                    <p className="text-xs text-[var(--muted)]">{active.userEmail}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setUserInfoOpen((v) => !v)} className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-[var(--surface)] transition">👤</button>
                  <button onClick={triggerDeleteChat} className="h-9 w-9 rounded-full border text-red-500 flex items-center justify-center hover:bg-red-50 transition">🗑</button>
                  <button onClick={() => setActive(null)} className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-[var(--surface)] transition">✕</button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {userInfoOpen ? (
                  <UserInfoPanel request={active} onClose={() => setUserInfoOpen(false)} />
                ) : (
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
                    onDeleteMessage={triggerDeleteMessage}
                    onLightbox={setLightboxImage}
                    bottomRef={bottomRef}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        danger={true}
        confirmLabel="Delete"
        onConfirm={onConfirmModal}
        onCancel={() => setModal({ ...modal, open: false })}
      />
    </div>
  );
}