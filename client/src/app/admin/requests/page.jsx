"use client";

import { useEffect, useState, useRef } from "react";
import { sendMessage, deleteMessage, deleteRequest } from "@/lib/api";
import { useAppContext } from "@/app/state/AppContext";
import BackToAdminButton from "@/components/BackToAdminButton";
import PageLoader from "@/components/PageLoader";
import ConfirmModal from "@/components/ConfirmModal";
import UserInfoPanel from "./UserInfoPanel";
import ChatPanel from "./ChatPanel";

// Firestore real-time imports
import { doc, updateDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TYPE_LABELS = {
  product_request: "Product Request",
  distributor: "Distributor Application",
  general_support: "General Support",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null); 
  const [chatOpen, setChatOpen] = useState(true);
  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [modal, setModal] = useState({ open: false, type: null, data: null, title: "", message: "" });

  const bottomRef = useRef(null);

  // --- REAL-TIME LISTENER ---
  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id,
        createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt
      }));
      setRequests(docs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const active = requests.find(r => r.id === activeId);

  useEffect(() => {
    if (chatOpen && !userInfoOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [active?.messages?.length, chatOpen, userInfoOpen]);

  const handleSelectRequest = async (r) => {
    setActiveId(r.id);
    setChatOpen(true);
    setUserInfoOpen(false);
    setReply("");
    setReplyImage(null);
    setReplyImagePreview("");
    setReplyingTo(null);

    if (r.status === "open") {
      try {
        await updateDoc(doc(db, "requests", r.id), { status: "answered" });
      } catch (err) {
        console.error("Status update error:", err);
      }
    }
  };

  const handleSend = async () => {
    if (!reply.trim() && !replyImage) return;
    if (!active) return;
    setSending(true);

    try {
      let imageUrl = "";
      if (replyImage) {
        setUploadingImage(true);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        const data = new FormData();
        data.append("file", replyImage);
        data.append("upload_preset", uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
        const result = await res.json();
        imageUrl = result.secure_url;
        setUploadingImage(false);
      }

      const payload = { from: "admin", text: reply.trim(), imageUrl: imageUrl || "" };
      if (replyingTo) {
        payload.replyTo = { text: replyingTo.text || "", imageUrl: replyingTo.imageUrl || "", from: replyingTo.from };
      }

      await sendMessage(active.id, payload);
      setReply("");
      setReplyImage(null);
      setReplyImagePreview("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  const onConfirmModal = async () => {
    const { type, data } = modal;
    setModal({ ...modal, open: false });
    try {
      if (type === "message") await deleteMessage(active.id, data);
      else if (type === "chat") {
        await deleteRequest(data);
        setActiveId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="site-frame py-6 sm:py-8 lg:py-10">
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
            <button onClick={() => setLightboxImage(null)} className="absolute -top-4 -right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">✕</button>
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader text="Connecting..." />
      ) : requests.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-[var(--border)] px-5 py-20 text-center">
          <p className="text-sm text-[var(--muted)] italic">No active requests.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
          <div className="divide-y divide-[var(--border)] rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden max-h-[700px] overflow-y-auto">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRequest(r)}
                className={`w-full text-left px-5 py-4 transition ${activeId === r.id ? "bg-[var(--surface)] border-l-4 border-[var(--accent)]" : "hover:bg-[var(--surface)] border-l-4 border-transparent"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold truncate">{r.userName || r.userEmail?.split("@")[0]}</p>
                  <span className={`text-[0.55rem] font-black uppercase px-2 py-0.5 rounded-full ${r.status === "open" ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-green-100 text-green-700"}`}>{r.status}</span>
                </div>
                <p className="text-[0.7rem] text-[var(--muted)]">{TYPE_LABELS[r.type] || r.type}</p>
              </button>
            ))}
          </div>

          {active && (
            <div className="flex flex-col rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden shadow-[var(--shadow)] h-[700px]">
              {/* Header and Panels remain clean */}
              <div className="flex-1 overflow-hidden">
                {userInfoOpen ? (
                  <UserInfoPanel request={active} onClose={() => setUserInfoOpen(false)} />
                ) : (
                  <ChatPanel
                    messages={active.messages}
                    reply={reply} setReply={setReply}
                    replyImage={replyImage} setReplyImage={setReplyImage}
                    replyImagePreview={replyImagePreview} setReplyImagePreview={setReplyImagePreview}
                    replyingTo={replyingTo} setReplyingTo={setReplyingTo}
                    sending={sending} uploadingImage={uploadingImage}
                    onSend={handleSend} onLightbox={setLightboxImage}
                    onDeleteMessage={(msg) => setModal({ open: true, type: "message", data: msg, title: "Delete message?", message: "This cannot be undone." })}
                    bottomRef={bottomRef}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal open={modal.open} title={modal.title} message={modal.message} danger={true} onConfirm={onConfirmModal} onCancel={() => setModal({ ...modal, open: false })} />
    </div>
  );
}