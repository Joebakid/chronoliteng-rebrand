const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || "Chronoliteng <hello@yourdomain.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@yourdomain.com";

// ─── Shared HTML wrapper ───────────────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Chronoliteng</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4de;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:28px 36px;">
              <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.12em;color:#ffffff;text-transform:uppercase;">Chronoliteng</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #e4e4de;background:#fafaf8;">
              <p style="margin:0;font-size:11px;color:#9a9a90;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} Chronoliteng. All rights reserved.<br/>
                You received this email because you have an account with us.
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
      <td style="padding:10px 0;border-bottom:1px solid #f0f0ea;">
        <p style="margin:0;font-size:13px;color:#1a1a1a;font-weight:500;">${item.name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#9a9a90;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0ea;text-align:right;font-size:13px;color:#1a1a1a;font-weight:600;white-space:nowrap;">
        ${fmt((item.price || 0) * item.quantity)}
      </td>
    </tr>
  `).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:#9a9a90;padding-bottom:8px;border-bottom:2px solid #e4e4de;">Item</th>
          <th style="text-align:right;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:#9a9a90;padding-bottom:8px;border-bottom:2px solid #e4e4de;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      </table>
  `;
}

// ══════════════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL
// ══════════════════════════════════════════════════════════════════════
async function sendWelcomeEmail({ to, name }) {
  const firstName = name?.split(" ")[0] || "there";
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a0a0a;">Welcome, ${firstName}.</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6a6a62;line-height:1.6;">
      Your Chronoliteng account is ready. We craft timepieces and footwear built to last — and we're glad you're here.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f7f7f3;border-radius:12px;padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#9a9a90;">Your account</p>
          <p style="margin:0;font-size:14px;color:#1a1a1a;">${to}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#6a6a62;line-height:1.6;">Here's what you can do from your account:</p>
    <ul style="margin:0 0 28px;padding-left:20px;">
      <li style="font-size:13px;color:#4a4a42;margin-bottom:8px;line-height:1.6;">Browse and order from our full collection</li>
      <li style="font-size:13px;color:#4a4a42;margin-bottom:8px;line-height:1.6;">Track your order history</li>
      <li style="font-size:13px;color:#4a4a42;line-height:1.6;">Send us product requests directly</li>
    </ul>

    <a href="https://chronoliteng.com/products" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.08em;">
      Shop the collection →
    </a>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Chronoliteng",
    html,
  });
}

// ══════════════════════════════════════════════════════════════════════
// 2. PASSWORD RESET
// ══════════════════════════════════════════════════════════════════════
async function sendPasswordResetEmail({ to, resetLink }) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a0a0a;">Reset your password</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6a6a62;line-height:1.6;">
      We received a request to reset the password for your Chronoliteng account. Click the button below to choose a new one.
    </p>

    <a href="${resetLink}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.08em;">
      Reset password →
    </a>

    <p style="margin:28px 0 0;font-size:12px;color:#9a9a90;line-height:1.6;">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your account is unchanged.
    </p>

    <p style="margin:16px 0 0;font-size:11px;color:#b0b0a8;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <span style="color:#0a0a0a;word-break:break-all;">${resetLink}</span>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Chronoliteng password",
    html,
  });
}

// ══════════════════════════════════════════════════════════════════════
// 3. ORDER CONFIRMATION (to customer)
// ══════════════════════════════════════════════════════════════════════
async function sendOrderConfirmationEmail({ to, name, orderId, items = [], total, paymentMethod }) {
  const firstName = name?.split(" ")[0] || "there";
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a0a0a;">Order confirmed.</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6a6a62;line-height:1.6;">
      Hi ${firstName}, thank you for your order. We've received your payment and will be in touch shortly.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f7f7f3;border-radius:12px;padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#9a9a90;">Order ID</p>
                <p style="margin:0;font-size:13px;color:#1a1a1a;font-family:monospace;">${orderId}</p>
              </td>
              <td style="text-align:right;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#9a9a90;">Payment</p>
                <p style="margin:0;font-size:13px;color:#1a1a1a;text-transform:capitalize;">${paymentMethod || "—"}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${orderItemsTable(items)}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 0;border-top:2px solid #0a0a0a;">
          <strong style="font-size:14px;color:#0a0a0a;">Total</strong>
        </td>
        <td style="padding:12px 0;border-top:2px solid #0a0a0a;text-align:right;">
          <strong style="font-size:16px;color:#0a0a0a;">${fmt(total || 0)}</strong>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;font-size:13px;color:#6a6a62;line-height:1.6;">
      Questions about your order? Reply to this email or reach us at
      <a href="mailto:${ADMIN_EMAIL}" style="color:#0a0a0a;">${ADMIN_EMAIL}</a>.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Order confirmed — ${orderId}`,
    html,
  });
}

// ══════════════════════════════════════════════════════════════════════
// 4. NEW ORDER ALERT (to admin)
// ══════════════════════════════════════════════════════════════════════
async function sendNewOrderAlertEmail({ orderId, customerName, customerEmail, items = [], total, paymentMethod }) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a0a0a;">New order received.</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6a6a62;line-height:1.6;">
      A new order has just been placed on Chronoliteng.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f7f7f3;border-radius:12px;padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#9a9a90;">Customer</p>
                <p style="margin:0;font-size:13px;color:#1a1a1a;">${customerName || "—"}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6a6a62;">${customerEmail}</p>
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#9a9a90;">Order ID</p>
                      <p style="margin:0;font-size:13px;color:#1a1a1a;font-family:monospace;">${orderId}</p>
                    </td>
                    <td style="text-align:right;">
                      <p style="margin:0 0 2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:#9a9a90;">Payment</p>
                      <p style="margin:0;font-size:13px;color:#1a1a1a;text-transform:capitalize;">${paymentMethod || "—"}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${orderItemsTable(items)}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 0;border-top:2px solid #0a0a0a;">
          <strong style="font-size:14px;color:#0a0a0a;">Total</strong>
        </td>
        <td style="padding:12px 0;border-top:2px solid #0a0a0a;text-align:right;">
          <strong style="font-size:16px;color:#0a0a0a;">${fmt(total || 0)}</strong>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;font-size:13px;color:#6a6a62;line-height:1.6;">
      Log in to the admin dashboard to manage this order.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New order — ${fmt(total || 0)} from ${customerName || customerEmail}`,
    html,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendNewOrderAlertEmail,
};