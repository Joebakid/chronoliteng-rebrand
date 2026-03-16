"use client";

/**
 * Shared component to display a quoted message above the input 
 * or inside a chat bubble.
 */
export default function MessageQuote({ message, onClear, isInsideBubble = false }) {
  if (!message) return null;

  return (
    <div className={`relative mb-2 flex flex-col rounded-xl border-l-4 border-[var(--accent)] bg-black/5 p-2 transition-all ${isInsideBubble ? 'opacity-80 scale-95 origin-left' : 'w-full animate-in slide-in-from-bottom-2'}`}>
      <div className="flex justify-between items-start">
        <p className="text-[0.6rem] font-black uppercase tracking-widest text-[var(--accent)]">
          Replying to {message.from === 'user' ? 'You' : 'Admin'}
        </p>
        {onClear && (
          <button onClick={onClear} className="text-[var(--muted)] hover:text-red-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        {message.imageUrl && (
          <img src={message.imageUrl} className="h-8 w-8 rounded-md object-cover" alt="ref" />
        )}
        <p className="text-xs italic line-clamp-1 text-[var(--foreground)] opacity-70">
          {message.text || "Image attachment"}
        </p>
      </div>
    </div>
  );
}