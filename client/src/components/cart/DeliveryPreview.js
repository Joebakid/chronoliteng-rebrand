import Link from "next/link";

export default function DeliveryPreview({ user, deliveryInfo }) {
  if (!user) return null;

  const hasDelivery = deliveryInfo?.phone && deliveryInfo?.address;

  return (
    <div className="rounded-2xl border px-4 py-3">
      {hasDelivery ? (
        <>
          <p className="text-xs font-bold">{deliveryInfo.name}</p>
          <p className="text-xs">{deliveryInfo.phone}</p>
          <p className="text-xs">
            {[deliveryInfo.address, deliveryInfo.city, deliveryInfo.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        </>
      ) : (
        <Link href="/account/profile" className="text-xs underline">
          Add delivery details
        </Link>
      )}
    </div>
  );
}