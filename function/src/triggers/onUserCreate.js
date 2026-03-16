const functions = require("firebase-functions");
const { sendWelcomeEmail } = require("../lib/resend");

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { email, displayName } = user;
  if (!email) return;
  try {
    await sendWelcomeEmail({ to: email, name: displayName || "" });
    console.log(`[onUserCreate] Welcome email sent to ${email}`);
  } catch (err) {
    console.error("[onUserCreate] Failed to send welcome email:", err);
  }
});