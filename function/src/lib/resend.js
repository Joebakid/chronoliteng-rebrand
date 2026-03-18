const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");

// Define the secret (This name must match the one you provide during deploy)
const resendKeySecret = defineSecret("RESEND_API_KEY");

// Constants
const FROM = "Chronoliteng <hello@chronolite.com.ng>";
const ADMIN_EMAIL = "chronoliteng@gmail.com";

/**
 * Helper to initialize Resend client with the secret from environment.
 * We initialize inside this getter to ensure the secret is loaded.
 */
const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not defined in environment.");
  }
  return new Resend(key);
};

// ─── Shared Premium HTML wrapper ───────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Chronoliteng</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0f0f0f;border-radius:24px;overflow:hidden;border:1px solid #222222;">
          <tr>
            <td style="background-color:#000000;padding:40px 48px;border-bottom:1px solid #1a1a1a;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.3em;color:#ffffff;text-transform:uppercase;font-family:serif;">C H R O N O L I T E</p>
            </td>
          </tr>
          <tr>
            <td style="padding:48px;color:#ffffff;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 48px;border-top:1px solid #1a1a1a;background-color:#0a0a0a;">
              <p style="margin:0;font-size:11px;color:#666666;text-align:center;line-height:1.8;letter-spacing:0.05em;">
                © ${new Date().getFullYear()} CHRONOLITENG. PREMIUM QUALITY TIMEPIECES & FOOTWEAR.<br/>
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
        <p style="margin:4px 0 0;font-size:12px;color:#888888;">Quantity: ${item.quantity}</p>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #222;text-align:right;font-size:14px;color:#ffffff;font-weight:700;">
        ${fmt((item.price || 0) * item.quantity)}
      </td>
    </tr>
  `).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#555555;padding-bottom:12px;border-bottom:1px solid #333;">Product</th>
          <th style="text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#555555;padding-bottom:12px;border-bottom:1px solid #333;">Subtotal</th>
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
  const resend = getResend();
  const firstName = name?.split(" ")[0] || "there";
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">The wait is over, <span style="color:#d4af37;">${firstName}</span>.</h1>
    <p style="margin:0 0 32px;font-size:16px;color:#aaaaaa;line-height:1.8;">
      Welcome to the inner circle of Chronoliteng. You now have access to Nigeria's most meticulously crafted timepieces and premium footwear.
    </p>
    <div style="background:#151515;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#666;">Verified Account</p>
      <p style="margin:0;font-size:16px;color:#ffffff;font-weight:600;">${to}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://chronolite.com.ng/products" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:18px 40px;border-radius:12px;font-size:14px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">
        Explore Collection
      </a>
    </div>
  `);

  return resend.emails.send({ from: FROM, to, subject: "Welcome to Chronoliteng", html });
}

// ══════════════════════════════════════════════════════════════════════
// 2. PASSWORD RESET
// ══════════════════════════════════════════════════════════════════════
async function sendPasswordResetEmail({ to, resetLink }) {
  const resend = getResend();
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#ffffff;">Secure Reset.</h1>
    <p style="margin:0 0 32px;font-size:16px;color:#aaaaaa;line-height:1.8;">
      A request was made to change your Chronoliteng password. For your security, please use the button below to proceed.
    </p>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${resetLink}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:18px 40px;border-radius:12px;font-size:14px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">
        Reset Password
      </a>
    </div>
  `);

  return resend.emails.send({ from: FROM, to, subject: "Reset your Chronoliteng password", html });
}

// ══════════════════════════════════════════════════════════════════════
// 3. ORDER CONFIRMATION
// ══════════════════════════════════════════════════════════════════════
async function sendOrderConfirmationEmail({ to, name, orderId, items = [], total, paymentMethod }) {
  const resend = getResend();
  const firstName = name?.split(" ")[0] || "there";
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#ffffff;">Acquisition Confirmed.</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.8;">
      Hi ${firstName}, we've successfully secured your order. Our team is now preparing your items for shipment.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#151515;border-radius:16px;border:1px solid #222;">
      <tr>
        <td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#666;">Order Number</p>
                <p style="margin:0;font-size:14px;color:#ffffff;font-family:monospace;letter-spacing:0.05em;">#${orderId.toUpperCase()}</p>
              </td>
              <td style="text-align:right;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#666;">Payment Mode</p>
                <p style="margin:0;font-size:14px;color:#ffffff;text-transform:capitalize;">${paymentMethod || "Secured Card"}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ${orderItemsTable(items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
      <tr>
        <td style="padding-top:20px;border-top:1px solid #333;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.1em;">Final Total</p>
        </td>
        <td style="padding-top:20px;border-top:1px solid #333;text-align:right;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">${fmt(total || 0)}</p>
        </td>
      </tr>
    </table>
  `);

  return resend.emails.send({ from: FROM, to, subject: `Confirmed Order — #${orderId}`, html });
}

// ══════════════════════════════════════════════════════════════════════
// 4. NEW ORDER ALERT (Admin)
// ══════════════════════════════════════════════════════════════════════
async function sendNewOrderAlertEmail({ orderId, customerName, customerEmail, items = [], total, paymentMethod }) {
  const resend = getResend();
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">New Order Entry.</h1>
    <div style="background:#151515;border-radius:16px;padding:24px;border:1px solid #222;margin-bottom:24px;">
       <p style="margin:0;font-size:15px;color:#ffffff;font-weight:600;">${customerName || "Member"}</p>
       <p style="margin:4px 0 0;font-size:13px;color:#888888;">${customerEmail}</p>
    </div>
    ${orderItemsTable(items)}
    <div style="text-align:right;margin-top:20px;">
      <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#ffffff;">${fmt(total || 0)}</p>
    </div>
  `);

  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: `New Sale: ${fmt(total)} - ${customerName}`, html });
}

module.exports = {
  resendKeySecret, // Export the secret definition
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendNewOrderAlertEmail,
};