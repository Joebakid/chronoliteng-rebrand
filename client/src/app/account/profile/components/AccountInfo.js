"use client";

export default function AccountInfo({ user, purchases, requests, loadingPurchases, loadingRequests }) {
  return (
    <section className="flex flex-col rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] lg:w-72 lg:flex-shrink-0">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Account</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">{user.name}</h1>
      <div className="mt-4 space-y-2.5 flex-1">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Email</p>
          <p className="mt-1.5 text-sm text-[var(--foreground)] truncate">{user.email}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Purchases</p>
          <p className="mt-1.5 text-sm text-[var(--foreground)]">{loadingPurchases ? "—" : purchases.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Requests</p>
          <p className="mt-1.5 text-sm text-[var(--foreground)]">{loadingRequests ? "—" : requests.length}</p>
        </div>
      </div>
    </section>
  );
}