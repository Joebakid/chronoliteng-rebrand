import { NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function buildOrderEmailHtml({ userName, items, total, reference, delivery }) {
  const fmt = (n) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#ffffff;font-size:14px;">
          ${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#d4af37;font-size:14px;text-align:right;font-weight:bold;">
          ${fmt(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const deliveryBlock = delivery?.address
    ? `<div style="background:#1a1a1a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;">Delivery Details</p>
        ${delivery.name ? `<p style="margin:0 0 4px;font-size:14px;color:#fff;font-weight:bold;">${delivery.name}</p>` : ""}
        ${delivery.phone ? `<p style="margin:0 0 4px;font-size:13px;color:#aaa;">${delivery.phone}</p>` : ""}
        <p style="margin:0;font-size:13px;color:#aaa;">${[delivery.address, delivery.city, delivery.state].filter(Boolean).join(", ")}</p>
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#050505;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#0f0f0f;border-radius:24px;border:1px solid #222;overflow:hidden;">
        <tr>
          <td style="background:#000;padding:36px 40px;text-align:center;border-bottom:1px solid #1a1a1a;">
            <p style="margin:0;font-size:18px;font-weight:bold;letter-spacing:0.4em;color:#fff;text-transform:uppercase;">C H R O N O L I T E</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;color:#fff;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:bold;color:#d4af37;text-transform:uppercase;letter-spacing:2px;">Order Confirmed</p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#fff;">Thank you, ${userName || "valued customer"}.</h1>
            <p style="margin:0 0 32px;font-size:14px;color:#aaa;line-height:1.7;">Your payment has been verified and your order is confirmed. We'll reach out with delivery updates shortly.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1a1a1a;margin-bottom:24px;">
              ${itemRows}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="font-size:13px;color:#aaa;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Total Paid</td>
                <td style="font-size:20px;color:#d4af37;font-weight:900;text-align:right;">${fmt(total)}</td>
              </tr>
            </table>

            ${deliveryBlock}

            <div style="background:#1a1a1a;border-radius:12px;padding:16px 20px;margin-bottom:32px;">
              <p style="margin:0 0 4px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;">Payment Reference</p>
              <p style="margin:0;font-size:13px;color:#fff;font-family:monospace;">${reference}</p>
            </div>

            <a href="https://chronolite.com.ng" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Continue Shopping</a>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;background:#050505;text-align:center;border-top:1px solid #1a1a1a;">
            <p style="margin:0;font-size:10px;color:#555;letter-spacing:1px;text-transform:uppercase;">© ${new Date().getFullYear()} CHRONOLITENG · Nigeria's Craftsmanship Excellence</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req) {
  try {
    const { reference, user, delivery, items, total } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    /* 1. Verify with Paystack */
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment not successful", details: paystackData.message },
        { status: 402 }
      );
    }

    const paidAmount = paystackData.data.amount / 100;
    const expectedAmount = Math.round(total);

    if (Math.abs(paidAmount - expectedAmount) > 1) {
      return NextResponse.json(
        { error: `Amount mismatch: paid ₦${paidAmount}, expected ₦${expectedAmount}` },
        { status: 402 }
      );
    }

    /* 2. Save verified order with delivery info */
    const orderRef = await addDoc(collection(db, "orders"), {
      userId: user?.id || user?.email || "guest",
      userEmail: user?.email || "",
      userName: user?.name || "",
      // Delivery details attached to every order
      delivery: {
        name: delivery?.name || user?.name || "",
        phone: delivery?.phone || "",
        address: delivery?.address || "",
        city: delivery?.city || "",
        state: delivery?.state || "",
      },
      items: items.map((item) => ({
        slug: item.slug || item.id || "",
        name: item.name,
        price: Number(item.price || 0),
        quantity: item.quantity,
        collection: item.collection || "",
        image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
      })),
      total: paidAmount,
      status: "paid",
      paymentMethod: "paystack",
      paystackRef: reference,
      paystackData: {
        channel: paystackData.data.channel,
        currency: paystackData.data.currency,
        paidAt: paystackData.data.paid_at,
        customerEmail: paystackData.data.customer?.email,
      },
      createdAt: new Date(),
    });

    /* 3. Send confirmation email via Resend */
    if (user?.email && process.env.RESEND_API_KEY) {
      const emailHtml = buildOrderEmailHtml({
        userName: delivery?.name || user.name || user.email,
        items,
        total: paidAmount,
        reference,
        delivery,
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Chronolite <orders@chronolite.com.ng>",
          to: user.email,
          subject: "Your Chronolite order is confirmed ✓",
          html: emailHtml,
        }),
      }).catch((err) => {
        console.error("[verify-payment] Resend email failed:", err);
      });
    }

    return NextResponse.json({ success: true, orderId: orderRef.id });
  } catch (err) {
    console.error("[verify-payment] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}