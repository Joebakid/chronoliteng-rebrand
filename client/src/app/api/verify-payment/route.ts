import { NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function buildOrderEmailHtml({ userName, items, totalPaid, plan, reference, delivery }) {
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

  const isInstallment = plan && plan.type === "installment";

  const paymentSummaryBlock = isInstallment
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="font-size:13px;color:#aaa;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Amount Paid Today</td>
          <td style="font-size:20px;color:#d4af37;font-weight:900;text-align:right;">${fmt(totalPaid)}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;padding-top:6px;">Remaining Balance</td>
          <td style="font-size:14px;color:#fff;font-weight:bold;text-align:right;padding-top:6px;">${fmt(plan.balanceDue)}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;padding-top:4px;">Payment Plan</td>
          <td style="font-size:12px;color:#aaa;text-align:right;padding-top:4px;">${plan.totalInstallments} Installments (30 Days)</td>
        </tr>
      </table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="font-size:13px;color:#aaa;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Total Paid</td>
          <td style="font-size:20px;color:#d4af37;font-weight:900;text-align:right;">${fmt(totalPaid)}</td>
        </tr>
      </table>`;

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
            <p style="margin:0 0 8px;font-size:11px;font-weight:bold;color:#d4af37;text-transform:uppercase;letter-spacing:2px;">
              ${isInstallment ? "Deposit Confirmed" : "Order Confirmed"}
            </p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#fff;">Thank you, ${userName || "valued customer"}.</h1>
            <p style="margin:0 0 32px;font-size:14px;color:#aaa;line-height:1.7;">
              ${
                isInstallment
                  ? "Your initial installment payment has been verified. You can track and pay your remaining installments directly from your account dashboard."
                  : "Your payment has been verified and your order is confirmed. We'll reach out with delivery updates shortly."
              }
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1a1a1a;margin-bottom:24px;">
              ${itemRows}
            </table>

            ${paymentSummaryBlock}

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

// Resolves the best available image from an incoming cart item.
function resolveItemImage(item) {
  return (
    item.selectedVariantImage ||
    item.selectedImage ||
    item.image ||
    item.thumbnail ||
    (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : "") ||
    ""
  );
}

export async function POST(req) {
  try {
    const { reference, user, delivery, items, total, plan, promoCode, discountValue } = await req.json();

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
    
    // Determine expected amount based on plan type or total
    const expectedAmount = plan ? Math.round(plan.amountPaidToday) : Math.round(total);

    if (Math.abs(paidAmount - expectedAmount) > 1) {
      return NextResponse.json(
        { error: `Amount mismatch: paid ₦${paidAmount}, expected ₦${expectedAmount}` },
        { status: 402 }
      );
    }

    /* 2. Process Installment / Full Payment Details */
    const isInstallment = plan && plan.type === "installment";
    const totalOrderAmount = plan ? plan.totalAmount : Math.round(total || paidAmount);
    const balanceDue = isInstallment ? plan.balanceDue : 0;
    const isFullyPaid = !isInstallment || balanceDue <= 0;

    let updatedSchedule = null;
    if (isInstallment && Array.isArray(plan.schedule)) {
      updatedSchedule = plan.schedule.map((slot, index) => {
        if (index === 0) {
          return {
            ...slot,
            status: "paid",
            paidAt: new Date().toISOString(),
            reference,
          };
        }
        return slot;
      });
    }

    /* 3. Save verified order to Firestore */
    const orderRef = await addDoc(collection(db, "orders"), {
      userId: user?.id || user?.email || "guest",
      userEmail: user?.email || "",
      userName: user?.name || "",
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
        selectedVariantImage: resolveItemImage(item),
      })),
      total: totalOrderAmount,
      totalAmount: totalOrderAmount,
      amountPaid: paidAmount,
      balanceDue: balanceDue,
      paymentType: isInstallment ? "installment" : "full",
      paymentStatus: isFullyPaid ? "fully_paid" : "partially_paid",
      status: isFullyPaid ? "paid" : "partially_paid",
      dispatchStatus: isFullyPaid ? "pending" : "hold_payment_plan",
      ...(isInstallment && updatedSchedule
        ? {
            installmentPlan: {
              totalInstallments: plan.totalInstallments,
              completedInstallments: 1,
              schedule: updatedSchedule,
            },
          }
        : {}),
      paymentMethod: "paystack",
      paystackRef: reference,
      authorizationCode: paystackData.data.authorization?.authorization_code || null,
      paystackData: {
        channel: paystackData.data.channel,
        currency: paystackData.data.currency,
        paidAt: paystackData.data.paid_at,
        customerEmail: paystackData.data.customer?.email,
      },
      ...(promoCode ? { promoCode, discountValue: Number(discountValue || 0) } : {}),
      createdAt: new Date(),
    });

    /* 4. Send confirmation email via Resend */
    if (user?.email && process.env.RESEND_API_KEY) {
      const emailHtml = buildOrderEmailHtml({
        userName: delivery?.name || user.name || user.email,
        items,
        totalPaid: paidAmount,
        plan,
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
          subject: isInstallment
            ? "Your Chronolite deposit is confirmed ✓"
            : "Your Chronolite order is confirmed ✓",
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