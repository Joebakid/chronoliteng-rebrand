// client/src/lib/emailTemplates.js

const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <style>
    :root { color-scheme: dark only; supported-color-schemes: dark only; }
    body { background-color: #050505 !important; color: #ffffff !important; margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#050505;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0f0f0f;border-radius:24px;border:1px solid #222222;overflow:hidden;">
          <tr>
            <td style="background-color:#000000;padding:40px;text-align:center;border-bottom:1px solid #1a1a1a;">
              <p style="margin:0;font-size:20px;font-weight:bold;letter-spacing:0.4em;color:#ffffff;text-transform:uppercase;">C H R O N O L I T E</p>
            </td>
          </tr>
          <tr>
            <td style="padding:48px;background-color:#0f0f0f;color:#ffffff;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;background-color:#050505;text-align:center;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:10px;color:#666666;letter-spacing:1px;text-transform:uppercase;">
                © ${new Date().getFullYear()} CHRONOLITENG. <br/>
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

export const getVerificationHtml = (name, code) => layout(`
  <p style="margin:0; font-size:11px; font-weight:bold; color:#d4af37; text-transform:uppercase; letter-spacing:2px;">Membership Auth</p>
  <h1 style="margin:12px 0 16px;font-size:26px;color:#ffffff;font-weight:700;">Complete your Registration</h1>
  <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.6;">Hello ${name},<br/><br/>You are one step away from joining the inner circle. To verify your identity and finalize your signup, please use the secure code below.</p>
  <div style="text-align:center; margin:40px 0;">
    <p style="margin:0 0 12px; font-size:10px; color:#555; text-transform:uppercase; letter-spacing:1px;">Your Private Access Code</p>
    <div style="display:inline-block; letter-spacing:10px; font-size:32px; font-weight:bold; color:#ffffff; background:#1a1a1a; padding:20px 40px; border-radius:12px; border:1px solid #333; font-family: monospace;">
      ${code}
    </div>
  </div>
`);

export const getWelcomeHtml = (name) => layout(`
  <h1 style="margin:0 0 16px;font-size:26px;color:#ffffff;font-weight:700;">The wait is over, <span style="color:#d4af37;">${name}</span>.</h1>
  <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.6;">Welcome to the inner circle. You now have access to Nigeria's most meticulously crafted timepieces.</p>
  <div style="text-align:center;">
    <a href="https://chronolite.com.ng" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:13px;font-weight:bold;text-transform:uppercase;">Explore Collection</a>
  </div>
`);

export const getAdminAlertHtml = (name, email) => layout(`
  <h1 style="margin:0 0 16px;font-size:22px;color:#d4af37;font-weight:700;">New Member Acquisition</h1>
  <div style="background-color:#1a1a1a; padding:24px; border-radius:16px; border:1px solid #333333;">
    <p style="margin:0; color:#666666; font-size:11px; text-transform:uppercase;">Name</p>
    <p style="margin:4px 0 20px; color:#ffffff; font-size:16px; font-weight:bold;">${name}</p>
    <p style="margin:0; color:#666666; font-size:11px; text-transform:uppercase;">Email</p>
    <p style="margin:4px 0 0; color:#ffffff; font-size:16px; font-weight:bold;">${email}</p>
  </div>
`);

/**
 * Added missing Reset Template
 */
export const getResetHtml = (email) => layout(`
  <h1 style="margin:0 0 16px;font-size:24px;color:#ffffff;font-weight:700;">Secure Reset.</h1>
  <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.6;">A password reset was requested for your account linked to <strong>${email}</strong>.</p>
  <div style="text-align:center;">
    <p style="color:#d4af37; font-size:14px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Account Security Active</p>
  </div>
`);