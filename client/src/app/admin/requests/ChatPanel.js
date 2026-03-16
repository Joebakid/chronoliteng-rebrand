"use client";

import { useRef } from "react";
import MessageQuote from "../../../components/MessageQuote";
import MessageBubble from "./MessageBubble";

export default function ChatPanel({
  messages,
  reply,
  setReply,
  replyImage,
  setReplyImage,
  replyImagePreview,
  setReplyImagePreview,
  replyingTo,
  setReplyingTo,
  sending,
  uploadingImage,
  onSend,
  onDeleteMessage,
  onLightbox,
  bottomRef,
}) {
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplyImage(file);
    setReplyImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-strong)]/30">
      
      {/* Messages Window */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-hide">

        {(messages || []).map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            msg={msg}
            onReply={setReplyingTo}
            onDelete={onDeleteMessage}
            onLightbox={onLightbox}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] p-4 bg-[var(--surface-strong)] space-y-3">

        {/* Reply Preview */}
        {replyingTo && (
          <MessageQuote
            message={replyingTo}
            onClear={() => setReplyingTo(null)}
          />
        )}

        {/* Image Preview */}
        {replyImagePreview && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--accent)] animate-in zoom-in-50">
            <img
              src={replyImagePreview}
              alt="preview"
              className="w-full h-full object-cover"
            />

            <button
              type="button"
              onClick={() => {
                setReplyImage(null);
                setReplyImagePreview("");
              }}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2 items-center bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-1.5 pr-3 focus-within:border-[var(--accent)] transition-all">

          {/* Upload Image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--accent)] transition flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            rows={1}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-transparent py-2 text-sm outline-none resize-none max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />

          {/* Send Button */}
          <button
            onClick={onSend}
            disabled={sending || uploadingImage || (!reply.trim() && !replyImage)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--surface-strong)] hover:scale-105 active:scale-95 disabled:opacity-20 transition shadow-sm"
          >
            {uploadingImage || sending ? (
              <div className="h-4 w-4 border-2 border-[var(--surface-strong)] border-t-transparent animate-spin rounded-full"/>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13"/>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>

        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

      </div>
    </div>
  );
}