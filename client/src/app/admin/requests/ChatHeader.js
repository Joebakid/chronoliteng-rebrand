"use client";

export default function ChatHeader({ active, onDeleteChat, onClose, toggleUserInfo }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-strong)]/50">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm ring-2 ring-[var(--surface)] shadow-sm">
          {(active.userName || "U").charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="text-sm font-bold leading-none">
            {active.userName || active.userEmail}
          </p>
          <p className="text-[10px] text-[var(--muted)] mt-1 font-medium">
            {active.userEmail}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleUserInfo}
          className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center text-xs hover:bg-[var(--surface)] transition"
          title="User Info"
        >
          👤
        </button>

        <button
          onClick={onDeleteChat}
          className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500 hover:bg-red-50 transition"
          title="Delete Entire Chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>

        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface)] transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}