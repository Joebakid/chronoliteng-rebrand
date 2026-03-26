import Link from "next/link";

export default function DeliveryPreview({ user, deliveryInfo }) {
  // We no longer return null if !user, because guests need to see their preview too
  const hasDelivery = deliveryInfo?.phone && deliveryInfo?.address && deliveryInfo?.name;

  return (
    <div className="rounded-2xl border border-[var(--border)] px-4 py-3 bg-[var(--surface-strong)]/50">
      <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
        Delivery To:
      </p>

      {hasDelivery ? (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[var(--foreground)]">
            {deliveryInfo.name}
          </p>
          <p className="text-[0.7rem] text-[var(--muted)]">
            {deliveryInfo.phone}
          </p>
          <p className="text-[0.7rem] leading-relaxed text-[var(--muted)]">
            {[deliveryInfo.address, deliveryInfo.city, deliveryInfo.state]
              .filter(Boolean)
              .join(", ")}
          </p>
          
          {/* Subtle badge to show they are checking out as a guest */}
          {!user && (
            <span className="mt-2 inline-block rounded-full bg-orange-500/10 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-orange-500">
              Guest Order
            </span>
          )}
        </div>
      ) : (
        <div className="py-1">
          {user ? (
            <Link 
              href="/account/profile" 
              className="text-[0.7rem] font-semibold text-orange-500 underline decoration-orange-500/30 underline-offset-4 hover:text-orange-600"
            >
              Add delivery details in profile
            </Link>
          ) : (
            <p className="text-[0.7rem] italic text-[var(--muted)]">
              Please fill in your delivery details above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}