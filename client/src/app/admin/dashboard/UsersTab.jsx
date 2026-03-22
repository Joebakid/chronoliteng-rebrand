"use client";

import { useState } from "react";
import PageLoader from "@/components/PageLoader";

const ITEMS_PER_PAGE = 8;

export default function UsersTab({ users = [], fetching }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = users.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="w-full space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        Registered users ({users.length})
      </h2>

      <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-strong)]">
        {fetching ? (
          <PageLoader text="Loading users" />
        ) : users.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">No users yet.</div>
        ) : (
          paginated.map((u) => (
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
                  Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!fetching && users.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-4">
          <button
            onClick={() => goTo(safePage - 1)}
            disabled={safePage <= 1}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`min-w-[40px] text-center rounded-xl px-3 py-2 text-sm border transition ${
                    p === safePage
                      ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]"
                      : "border-[var(--border)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goTo(safePage + 1)}
            disabled={safePage >= totalPages}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}