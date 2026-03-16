"use client";

const TYPE_LABELS = {
  product_request: "Product Request",
  distributor: "Distributor Application",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function UserInfoPanel({ request, onClose }) {
  const purchases = request.userPurchases || [];
  const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-strong)] flex-shrink-0">
        <p className="text-sm font-semibold">User info</p>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] transition text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Identity */}
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Identity</p>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {[
              { label: "Name", value: request.userName || "—" },
              { label: "Email", value: request.userEmail || "—" },
              { label: "User ID", value: request.userId || "—" },
              { label: "Member since", value: request.userCreatedAt ? formatDate(request.userCreatedAt) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-sm text-[var(--foreground)] break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* This request */}
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">This request</p>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {[
              { label: "Type", value: TYPE_LABELS[request.type] || request.type },
              { label: "Status", value: request.status },
              { label: "Opened", value: formatDate(request.createdAt) },
              { label: "Messages", value: (request.messages || []).length },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase history */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Purchase history</p>
            <p className="text-[0.65rem] text-[var(--muted)]">{purchases.length} order{purchases.length !== 1 ? "s" : ""} · {fmt(totalSpent)}</p>
          </div>
          {purchases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-center text-sm text-[var(--muted)]">No purchases on record.</div>
          ) : (
            <div className="space-y-2">
              {purchases.map((p, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-[0.68rem] text-[var(--muted)]">{formatDate(p.createdAt)}</p>
                    <p className="text-sm font-semibold">{fmt(p.total)}</p>
                  </div>
                  <div className="space-y-1">
                    {(p.items || []).map((item, j) => (
                      <div key={j} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[var(--foreground)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--muted)] flex-shrink-0">×{item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other requests */}
        {request.allUserRequests && request.allUserRequests.length > 1 && (
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Other requests</p>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
              {request.allUserRequests.filter((r) => r.id !== request.id).map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">{TYPE_LABELS[r.type] || r.type}</p>
                    <p className="text-[0.65rem] text-[var(--muted)]">{formatDate(r.createdAt)}</p>
                  </div>
                  <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}