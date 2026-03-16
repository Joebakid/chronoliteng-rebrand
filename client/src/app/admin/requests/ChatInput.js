"use client";

export default function ChatInput({ 
  reply, 
  setReply, 
  sending, 
  onSend, 
  onImageClick, 
  hasImage 
}) {
  return (
    <div className="border-t border-[var(--border)] p-4 bg-[var(--surface-strong)]/50">
      <div className="flex items-center gap-3 bg-[var(--surface)] rounded-full border border-[var(--border)] p-1.5 pl-4 focus-within:border-[var(--accent)] transition-all shadow-sm">
        {/* FIX: Set text-base (16px) to prevent mobile zoom-in/out */}
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to customer..."
          className="flex-1 bg-transparent text-base outline-none py-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <button
          type="button"
          onClick={onImageClick}
          className={`p-2 transition ${hasImage ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--accent)]"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>

        <button
          onClick={onSend}
          disabled={sending || (!reply.trim() && !hasImage)}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--surface-strong)] hover:scale-105 active:scale-95 disabled:opacity-20 transition shadow-md shrink-0"
        >
          {sending ? (
            <div className="h-4 w-4 border-2 border-[var(--surface-strong)] border-t-transparent animate-spin rounded-full" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}