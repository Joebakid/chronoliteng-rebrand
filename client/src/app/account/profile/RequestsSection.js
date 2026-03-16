"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createRequest, sendMessage, deleteMessage, deleteRequest } from "@/lib/api"; // Added deleteRequest
import MessageQuote from "../../../components/MessageQuote"; 
import ConfirmModal from "@/components/ConfirmModal";

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

const REQUEST_TYPES = [
  { value: "product_request", label: "Product Sourcing" },
  { value: "distributor", label: "Distribution Inquiry" },
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
  const json = await res.json();
  return json.secure_url;
}

export default function RequestsSection({ user, requests, loading, onRefresh, onLightbox }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [readRequests, setReadRequests] = useState(new Set());

  // Form states (New Request)
  const [requestForm, setRequestForm] = useState({ type: "product_request", message: "" });
  const [requestImage, setRequestImage] = useState(null);
  const [requestImagePreview, setRequestImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Chat states (Existing Chats)
  const [activeId, setActiveId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messageImage, setMessageImage] = useState(null);
  const [messageImagePreview, setMessageImagePreview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);

  // Modal State
  const [modal, setModal] = useState({ open: false, type: null, data: null, requestId: null, title: "", message: "" });
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const unreadCount = useMemo(() => {
    return requests.filter(req => {
      const lastMsg = req.messages?.[req.messages.length - 1];
      return lastMsg?.from === "admin" && !readRequests.has(req.id);
    }).length;
  }, [requests, readRequests]);

  const markAsRead = (id) => {
    setReadRequests(prev => new Set([...prev, id]));
  };

  useEffect(() => {
    if (activeId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [requests, activeId]);

  const handleSendMessage = async (req) => {
    const hasImage = activeId === req.id && messageImage;
    if (!newMessage.trim() && !hasImage) return;

    setSending(true);
    markAsRead(req.id);
    try {
      let imageUrl = "";
      if (hasImage) {
        imageUrl = await uploadImageToCloudinary(messageImage);
      }
      
      await sendMessage(req.id, { 
        from: "user", 
        text: newMessage.trim(), 
        imageUrl,
        replyTo: replyingTo ? {
          text: replyingTo.text,
          imageUrl: replyingTo.imageUrl,
          from: replyingTo.from
        } : null
      });

      setNewMessage("");
      setMessageImage(null);
      setMessageImagePreview("");
      setReplyingTo(null);
      onRefresh();
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setSending(false);
    }
  };

  // --- DELETE HANDLERS ---
  const triggerDeleteMessage = (reqId, msg) => {
    setModal({
      open: true,
      type: "message",
      requestId: reqId,
      data: msg,
      title: "Delete Message?",
      message: "This specific message will be removed from your history."
    });
  };

  const triggerDeleteChat = (reqId) => {
    setModal({
      open: true,
      type: "chat",
      requestId: reqId,
      data: null,
      title: "Delete Entire Chat?",
      message: "This will permanently remove the whole conversation. This action cannot be undone."
    });
  };

  const handleConfirmDelete = async () => {
    const { type, requestId, data } = modal;
    setModal({ ...modal, open: false });
    
    try {
      if (type === "message") {
        await deleteMessage(requestId, data);
      } else if (type === "chat") {
        await deleteRequest(requestId);
        if (activeId === requestId) setActiveId(null);
      }
      onRefresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <section className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] overflow-hidden transition-all duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-4 flex-1 group">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] group-hover:bg-[var(--accent)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-4 ring-[var(--surface-strong)] animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Support Hub</p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Chats</h2>
          </div>
          <ChevronIcon open={open} />
        </button>
        
        <button
          onClick={() => { setOpen(true); setShowForm(!showForm); }}
          className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--surface-strong)] hover:scale-105 transition"
        >
          {showForm ? "Close Form" : "Start New Chat"}
        </button>
      </div>

      {open && (
        <div className="px-6 pb-8 space-y-6 border-t border-[var(--border)] pt-6">
          
          {showForm && (
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-[0.6rem] font-black uppercase text-[var(--muted)] ml-2">Topic</label>
                <select
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
                >
                  {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <textarea
                rows={3}
                value={requestForm.message}
                onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                placeholder="Type your message here..."
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm outline-none focus:ring-1 ring-[var(--accent)]"
              />
              <div className="flex items-center justify-between">
                <button 
                   onClick={() => { setActiveId(null); fileInputRef.current?.click(); }} 
                   className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {requestImage ? "✓ Photo Attached" : "+ Add Photo"}
                </button>
                <button
                  onClick={async () => {
                    setSubmitting(true);
                    let imageUrl = requestImage ? await uploadImageToCloudinary(requestImage) : "";
                    await createRequest(user, { ...requestForm, imageUrl });
                    setRequestForm({ type: "product_request", message: "" });
                    setRequestImage(null);
                    setRequestImagePreview("");
                    setShowForm(false);
                    onRefresh();
                    setSubmitting(false);
                  }}
                  disabled={submitting || !requestForm.message}
                  className="rounded-full bg-[var(--accent)] px-8 py-3 text-xs font-bold text-white disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Create Request"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-6">
            {loading ? (
               <div className="animate-pulse space-y-4 py-10">
                  <div className="h-20 bg-[var(--surface)] rounded-3xl" />
                  <div className="h-20 bg-[var(--surface)] rounded-3xl" />
               </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-[2rem]">
                <p className="text-[var(--muted)] text-sm italic">No active conversations found.</p>
              </div>
            ) : (
              requests.map((req) => {
                const isUnread = req.messages?.[req.messages.length - 1]?.from === "admin" && !readRequests.has(req.id);
                
                return (
                  <article key={req.id} className={`group rounded-[2.5rem] border transition-all bg-[var(--surface)] ${isUnread ? 'border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                    
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]/50">
                      <h3 className="text-xs font-black uppercase tracking-tighter text-[var(--foreground)]">
                        {REQUEST_TYPES.find(t => t.value === req.type)?.label || req.type}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[var(--muted)]">{formatDate(req.createdAt)}</span>
                        {/* DELETE CHAT BUTTON */}
                        <button 
                          onClick={() => triggerDeleteChat(req.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition"
                          title="Delete conversation"
                        >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 max-h-[400px] overflow-y-auto bg-[var(--surface)]/30">
                      {req.messages?.map((msg, i) => {
                        const isMe = msg.from === "user";
                        return (
                          <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
                            {!isMe && <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[8px] text-white font-bold shrink-0">AD</div>}
                            
                            <div className={`group/msg relative max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm ${
                              isMe ? "bg-[var(--foreground)] text-[var(--surface-strong)] rounded-br-none" : "bg-[var(--surface-strong)] text-[var(--foreground)] rounded-bl-none border border-[var(--border)]"
                            }`}>
                              {msg.replyTo && <MessageQuote message={msg.replyTo} isInsideBubble={true} />}
                              {msg.imageUrl && (
                                <img src={msg.imageUrl} onClick={() => onLightbox(msg.imageUrl)} className="mb-2 rounded-xl max-h-48 w-full object-cover cursor-zoom-in" alt="chat" />
                              )}
                              <div className="flex justify-between items-start gap-4">
                                {msg.text && <p className="leading-relaxed font-medium">{msg.text}</p>}
                                <div className="flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                  {/* REPLY BUTTON */}
                                  <button 
                                    onClick={() => { setActiveId(req.id); setReplyingTo(msg); }}
                                    className="p-1 text-[var(--muted)] hover:text-[var(--accent)]"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 17L4 12L9 7M20 18V13C20 12.4696 19.7893 11.9609 19.4142 11.5858C19.0391 11.2107 18.5304 11 18 11H5"/></svg>
                                  </button>
                                  {/* DELETE INDIVIDUAL TEXT BUTTON (Only for your own texts) */}
                                  {isMe && (
                                    <button 
                                      onClick={() => triggerDeleteMessage(req.id, msg)}
                                      className="p-1 text-[var(--muted)] hover:text-red-500"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className={`text-[9px] mt-1 font-bold opacity-40 ${isMe ? "text-right" : "text-left"}`}>
                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-4 bg-[var(--surface-strong)]/50 border-t border-[var(--border)]">
                      {activeId === req.id && replyingTo && (
                        <MessageQuote message={replyingTo} onClear={() => setReplyingTo(null)} />
                      )}
                      
                      {activeId === req.id && messageImagePreview && (
                        <div className="relative mb-3 w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--accent)] shadow-lg animate-in zoom-in-50">
                          <img src={messageImagePreview} className="w-full h-full object-cover" alt="preview" />
                          <button 
                            onClick={() => { setMessageImage(null); setMessageImagePreview(""); }} 
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-500 transition"
                          >✕</button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 bg-[var(--surface)] rounded-full border border-[var(--border)] p-1.5 pl-4 focus-within:border-[var(--accent)] transition-all">
                        <input
                          value={activeId === req.id ? newMessage : ""}
                          onChange={(e) => { setActiveId(req.id); setNewMessage(e.target.value); }}
                          onFocus={() => { setActiveId(req.id); markAsRead(req.id); }}
                          placeholder="Reply to admin..."
                          className="flex-1 bg-transparent text-sm outline-none"
                          onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(req); } }}
                        />
                        
                        <button 
                          onClick={() => { setActiveId(req.id); fileInputRef.current?.click(); }} 
                          className={`p-2 transition ${activeId === req.id && messageImage ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--accent)]"}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </button>
                        
                        <button
                          onClick={() => handleSendMessage(req)}
                          disabled={sending || (!newMessage.trim() && !(activeId === req.id && messageImage))}
                          className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--surface-strong)] hover:scale-105 active:scale-95 disabled:opacity-20 transition shadow-md"
                        >
                          {sending ? (
                            <div className="h-4 w-4 border-2 border-[var(--surface-strong)] border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                          )}
                        </button>
                      </div>
                    </div>

                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmModal 
        open={modal.open}
        title={modal.title}
        message={modal.message}
        danger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal({ ...modal, open: false })}
      />

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const preview = URL.createObjectURL(file);
          if (showForm && activeId === null) {
            setRequestImage(file);
            setRequestImagePreview(preview);
          } else {
            setMessageImage(file);
            setMessageImagePreview(preview);
          }
          e.target.value = '';
        }} 
      />
    </section>
  );
}