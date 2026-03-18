import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Chronoliteng <hello@chronolite.com.ng>";
const ADMIN_EMAIL = "chronoliteng@gmail.com";

// ─── Shared Premium HTML wrapper ───────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0f0f0f;border-radius:24px;overflow:hidden;border:1px solid #222222;">
          <tr>
            <td style="background-color:#000000;padding:40px 48px;border-bottom:1px solid #1a1a1a;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.3em;color:#ffffff;text-transform:uppercase;">C H R O N O L I T E</p>
            </td>
          </tr>
          <tr>
            <td style="padding:48px;color:#ffffff;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 48px;border-top:1px solid #1a1a1a;background-color:#0a0a0a;">
              <p style="margin:0;font-size:11px;color:#666666;text-align:center;line-height:1.8;">
                © ${new Date().getFullYear()} CHRONOLITENG. PREMIUM QUALITY TIMEPIECES.<br/>
                Nigeria's Craftsmanship Excellence.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helper: format currency ───────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

// ─── Helper: order items table ─────────────────────────────────────────────
function orderItemsTable(items = []) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #222;">
        <p style="margin:0;font-size:14px;color:#ffffff;font-weight:600;">${item.name}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#888888;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #222;text-align:right;font-size:14px;color:#ffffff;font-weight:700;">
        ${fmt((item.price || 0) * item.quantity)}
      </td>
    </tr>
  `).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;text-transform:uppercase;color:#555;padding-bottom:12px;border-bottom:1px solid #333;">Product</th>
          <th style="text-align:right;font-size:10px;text-transform:uppercase;color:#555;padding-bottom:12px;border-bottom:1px solid #333;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, subject, htmlType, data } = body;

    let htmlBody = "";

    switch (htmlType) {
      case 'welcome':
        htmlBody = layout(`
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;">The wait is over, <span style="color:#d4af37;">${data.name}</span>.</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#aaaaaa;line-height:1.8;">Welcome to the inner circle of Chronoliteng. You now have access to Nigeria's most meticulously crafted timepieces.</p>
          <div style="text-align:center;">
            <a href="https://chronolite.com.ng/products" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:18px 40px;border-radius:12px;font-size:14px;font-weight:800;text-transform:uppercase;">Explore Collection</a>
          </div>
        `);
        break;

      case 'reset':
        htmlBody = layout(`
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#ffffff;">Secure Reset.</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#aaaaaa;line-height:1.8;">A request was made to change your Chronoliteng password. If this was you, use the button below.</p>
          <div style="text-align:center;">
             <p style="color:#d4af37; font-size:12px;">(Link generation happens via Firebase client-side)</p>
          </div>
        `);
        break;

      case 'order':
        htmlBody = layout(`
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#ffffff;">Acquisition Confirmed.</h1>
          <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;">Order ID: #${data.orderId}</p>
          ${orderItemsTable(data.items)}
          <p style="font-size:20px; color:#ffffff; font-weight:800; text-align:right;">Total: ${fmt(data.total)}</p>
        `);
        break;

      default:
        htmlBody = layout(`<p>${subject}</p>`);
    }

    const { data: resData, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: subject,
      html: htmlBody,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, resData });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}