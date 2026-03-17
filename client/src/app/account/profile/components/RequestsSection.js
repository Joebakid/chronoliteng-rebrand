"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createRequest, sendMessage, deleteMessage, deleteRequest } from "@/lib/api";
import MessageQuote from "@/components/MessageQuote";
import ConfirmModal from "@/components/ConfirmModal";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import RequestForm from "./RequestForm";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ChevronIcon({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}>
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

async function uploadImageToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
  const json = await res.json();
  return json.secure_url;
}

export default function RequestsSection({ user, requests, loading, onRefresh, onLightbox }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [readRequests, setReadRequests] = useState(new Set());

  // Form & Chat states
  const [requestForm, setRequestForm] = useState({ type: "product_request", message: "" });
  const [requestImage, setRequestImage] = useState(null);
  const [requestImagePreview, setRequestImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [activeId, setActiveId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messageImage, setMessageImage] = useState(null);
  const [messageImagePreview, setMessageImagePreview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState({ open: false, type: null, data: null, requestId: null, title: "", message: "" });
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const unreadCount = useMemo(() => {
    return requests.filter(req => {
      const lastMsg = req.messages?.[req.messages.length - 1];
      return lastMsg?.from === "admin" && !readRequests.has(req.id);
    }).length;
  }, [requests, readRequests]);

  const markAsRead = (id) => setReadRequests(prev => new Set([...prev, id]));

  useEffect(() => {
    if (activeId) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [requests, activeId]);

  const handleCreateRequest = async () => {
    setSubmitting(true);
    try {
      let imageUrl = requestImage ? await uploadImageToCloudinary(requestImage) : "";
      await createRequest(user, { ...requestForm, imageUrl });
      setRequestForm({ type: "product_request", message: "" });
      setRequestImage(null); setRequestImagePreview("");
      setShowForm(false);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleSendMessage = async (reqId) => {
    const hasImage = activeId === reqId && messageImage;
    if (!newMessage.trim() && !hasImage) return;
    setSending(true);
    markAsRead(reqId);
    try {
      let imageUrl = hasImage ? await uploadImageToCloudinary(messageImage) : "";
      await sendMessage(reqId, { 
        from: "user", text: newMessage.trim(), imageUrl,
        replyTo: replyingTo ? { text: replyingTo.text, imageUrl: replyingTo.imageUrl, from: replyingTo.from } : null
      });
      setNewMessage(""); setMessageImage(null); setMessageImagePreview(""); setReplyingTo(null);
      onRefresh();
    } finally { setSending(false); }
  };

  const handleConfirmDelete = async () => {
    const { type, requestId, data } = modal;
    setModal({ ...modal, open: false });
    try {
      if (type === "message") await deleteMessage(requestId, data);
      else if (type === "chat") {
        await deleteRequest(requestId);
        if (activeId === requestId) setActiveId(null);
      }
      onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <section className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] overflow-hidden transition-all duration-500">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-4 flex-1 group">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] group-hover:bg-[var(--accent)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-4 ring-[var(--surface-strong)] animate-bounce">{unreadCount}</span>}
          </div>
          <div className="text-left">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Support Hub</p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Chats</h2>
          </div>
          <ChevronIcon open={open} />
        </button>
        <button onClick={() => { setOpen(true); setShowForm(!showForm); }} className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--surface-strong)] hover:scale-105 transition">
          {showForm ? "Close Form" : "Start New Chat"}
        </button>
      </div>

      {open && (
        <div className="px-6 pb-8 space-y-6 border-t border-[var(--border)] pt-6">
          {showForm && (
            <RequestForm 
              form={requestForm} onChange={setRequestForm} image={requestImage} 
              onUpload={() => { setActiveId(null); fileInputRef.current?.click(); }} 
              onSubmit={handleCreateRequest} submitting={submitting} 
            />
          )}

          <div className="grid gap-6">
            {loading ? (
               <div className="animate-pulse space-y-4 py-10"><div className="h-20 bg-[var(--surface)] rounded-3xl" /><div className="h-20 bg-[var(--surface)] rounded-3xl" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-[2rem] text-[var(--muted)] text-sm italic">No active conversations found.</div>
            ) : (
              requests.map((req) => (
                <article key={req.id} className="group rounded-[2.5rem] border border-[var(--border)] transition-all bg-[var(--surface)]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]/50">
                    <h3 className="text-xs font-black uppercase tracking-tighter text-[var(--foreground)]">{req.type.replace('_', ' ')}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[var(--muted)]">{formatDate(req.createdAt)}</span>
                      <button onClick={() => setModal({ open: true, type: "chat", requestId: req.id, title: "Delete Chat?", message: "This is permanent." })} className="p-1.5 rounded-full hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 max-h-[400px] overflow-y-auto bg-[var(--surface)]/30">
                    {req.messages?.map((msg, i) => (
                      <ChatBubble key={i} msg={msg} isMe={msg.from === "user"} onLightbox={onLightbox}
                        onReply={() => { setActiveId(req.id); setReplyingTo(msg); }}
                        onDelete={() => setModal({ open: true, type: "message", requestId: req.id, data: msg, title: "Delete message?", message: "It will be removed." })} 
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <ChatInput 
                    value={activeId === req.id ? newMessage : ""} onChange={(val) => { setActiveId(req.id); setNewMessage(val); }}
                    onSend={() => handleSendMessage(req.id)} onUpload={() => { setActiveId(req.id); fileInputRef.current?.click(); }}
                    replyingTo={activeId === req.id ? replyingTo : null} onClearReply={() => setReplyingTo(null)}
                    imagePreview={activeId === req.id ? messageImagePreview : ""} onClearImage={() => { setMessageImage(null); setMessageImagePreview(""); }}
                    sending={sending} hasImage={activeId === req.id && !!messageImage}
                  />
                </article>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmModal open={modal.open} title={modal.title} message={modal.message} danger={true} onConfirm={handleConfirmDelete} onCancel={() => setModal({ ...modal, open: false })} />
      
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const preview = URL.createObjectURL(file);
          if (showForm && activeId === null) { setRequestImage(file); setRequestImagePreview(preview); }
          else { setMessageImage(file); setMessageImagePreview(preview); }
          e.target.value = '';
      }} />
    </section>
  );
}