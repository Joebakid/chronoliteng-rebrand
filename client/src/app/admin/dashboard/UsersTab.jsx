"use client";

import PageLoader from "@/components/PageLoader";
import Pagination from "@/components/Pagination";

export default function UsersTab({ users, fetching, totalPages }) {
  return (
    <div>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        Registered users ({users.length})
      </h2>

      <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {fetching ? (
          <PageLoader text="Loading users" />
        ) : users.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            No users yet.
          </div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center text-xs font-bold text-[var(--muted)] uppercase">
                {u.name?.[0] || u.email?.[0] || "?"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name || "—"}</p>
                <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {u.isAdmin && (
                  <span className="text-[0.62rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)]">
                    Admin
                  </span>
                )}

                <p className="text-xs text-[var(--muted)]">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("en-NG")
                    : "—"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!fetching && users.length > 0 && (
        <Pagination totalPages={totalPages} />
      )}
    </div>
  );
}