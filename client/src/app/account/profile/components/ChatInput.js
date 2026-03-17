"use client";
import MessageQuote from "@/components/MessageQuote";

export default function ChatInput({ 
  value, onChange, onSend, onUpload, replyingTo, onClearReply, imagePreview, onClearImage, sending, hasImage 
}) {
  return (
    <div className="p-4 bg-[var(--surface-strong)]/50 border-t border-[var(--border)]">
      {replyingTo && <MessageQuote message={replyingTo} onClear={onClearReply} />}
      
      {imagePreview && (
        <div className="relative mb-3 w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--accent)] shadow-lg">
          <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
          <button 
            onClick={onClearImage} 
            className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
          >✕</button>
        </div>
      )}
      
      <div className="flex items-center gap-3 bg-[var(--surface)] rounded-full border border-[var(--border)] p-1.5 pl-4 focus-within:border-[var(--accent)] transition-all">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Reply to admin..."
          className="flex-1 bg-transparent text-sm outline-none"
          onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        />
        
        <button onClick={onUpload} className={`p-2 transition ${hasImage ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--accent)]"}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
        
        <button
          onClick={onSend}
          disabled={sending || (!value.trim() && !hasImage)}
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
  );
}