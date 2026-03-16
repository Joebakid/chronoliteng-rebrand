"use client";

import MessageQuote from "../../../components/MessageQuote";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MessageBubble({ msg, onReply, onDelete, onLightbox }) {
  const isAdmin = msg.from === "admin";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"} items-end gap-2`}>
      {!isAdmin && (
        <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[8px] text-white font-bold shrink-0">
          UR
        </div>
      )}

      <div
        className={`relative max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm shadow-sm ${
          isAdmin
            ? "bg-[var(--foreground)] text-[var(--surface-strong)] rounded-br-none"
            : "bg-[var(--surface-strong)] text-[var(--foreground)] rounded-bl-none border border-[var(--border)]"
        }`}
      >
        {/* Reply Quote */}
        {msg.replyTo && <MessageQuote message={msg.replyTo} isInsideBubble={true} />}
        
        {/* Image Attachment */}
        {msg.imageUrl && (
          <div className="relative group">
            <img
              src={msg.imageUrl}
              alt="attachment"
              className="mb-2 rounded-xl max-h-[250px] w-full object-cover cursor-pointer"
              onClick={() => onLightbox(msg.imageUrl)}
            />
          </div>
        )}

        <div className="flex justify-between items-end gap-3">
          {/* Message Text */}
          {msg.text && (
            <p className="leading-relaxed font-medium break-words">
              {msg.text}
            </p>
          )}

          {/* Action Buttons - Always visible for mobile accessibility */}
          <div className="flex items-center gap-1 shrink-0 mb-[-2px]">
            {/* REPLY BUTTON */}
            <button
              onClick={() => onReply(msg)}
              className={`p-1.5 rounded-full transition-colors ${
                isAdmin 
                  ? "text-[var(--surface-strong)]/60 hover:bg-white/10 hover:text-white" 
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--accent)]"
              }`}
              title="Reply"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 17L4 12L9 7M20 18V13C20 12.4696 19.7893 11.9609 19.4142 11.5858C19.0391 11.2107 18.5304 11 18 11H5" />
              </svg>
            </button>

            {/* DELETE BUTTON - Admin Only */}
            {isAdmin && (
              <button
                onClick={() => onDelete(msg)}
                className="p-1.5 rounded-full text-[var(--surface-strong)]/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <p className={`text-[9px] mt-1 font-bold opacity-40 ${isAdmin ? "text-right" : "text-left"}`}>
          {formatDate(msg.sentAt)}
        </p>
      </div>
    </div>
  );
}