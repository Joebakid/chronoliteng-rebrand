"use client";

import PageLoader from "@/components/PageLoader";

export default function UsersTab({ users = [], fetching }) {
  return (
    <div className="w-full">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        Registered users ({users.length})
      </h2>

      <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-strong)]">
        {fetching ? (
          <PageLoader text="Loading users" />
        ) : users.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">No users yet.</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 hover:bg-[var(--surface)] transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center text-xs font-bold text-[var(--muted)] uppercase">
                  {u.name?.[0] || u.email?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{u.name || "Unnamed User"}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                {u.isAdmin && (
                  <span className="text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Admin
                  </span>
                )}
                <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-tighter">
                  Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { month: 'short', year: 'numeric' }) : "—"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}