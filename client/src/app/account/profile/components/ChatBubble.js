"use client";
import MessageQuote from "@/components/MessageQuote";

export default function ChatBubble({ msg, isMe, onReply, onDelete, onLightbox }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
      {!isMe && (
        <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[8px] text-white font-bold shrink-0">
          AD
        </div>
      )}
      
      <div className={`group/msg relative max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm ${
        isMe 
          ? "bg-[var(--foreground)] text-[var(--surface-strong)] rounded-br-none" 
          : "bg-[var(--surface-strong)] text-[var(--foreground)] rounded-bl-none border border-[var(--border)]"
      }`}>
        {msg.replyTo && <MessageQuote message={msg.replyTo} isInsideBubble={true} />}
        
        {msg.imageUrl && (
          <img 
            src={msg.imageUrl} 
            onClick={() => onLightbox(msg.imageUrl)} 
            className="mb-2 rounded-xl max-h-48 w-full object-cover cursor-zoom-in" 
            alt="chat attachment" 
          />
        )}

        <div className="flex justify-between items-end gap-4">
          {msg.text && <p className="leading-relaxed font-medium">{msg.text}</p>}
          
          <div className="flex items-center gap-1 shrink-0 mb-[-2px]">
            <button 
              onClick={onReply} 
              className={`p-1.5 rounded-full transition-colors ${
                isMe ? "text-[var(--surface-strong)]/60 hover:bg-white/10" : "text-[var(--muted)] hover:bg-[var(--surface)]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 17L4 12L9 7M20 18V13C20 12.4696 19.7893 11.9609 19.4142 11.5858C19.0391 11.2107 18.5304 11 18 11H5"/>
              </svg>
            </button>
            {isMe && (
              <button 
                onClick={onDelete} 
                className="p-1.5 rounded-full text-[var(--surface-strong)]/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
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
}