const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { resendKeySecret, sendPasswordResetEmail } = require("../lib/resend");

// Callable function — call from your frontend with: 
// httpsCallable(functions, 'sendPasswordReset')({ email })
exports.sendPasswordReset = functions
  .runWith({ secrets: [resendKeySecret] })
  .https.onCall(async (data) => {
    const { email } = data;
    if (!email) throw new functions.https.HttpsError("invalid-argument", "Email is required.");

    try {
      // Generate Firebase reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);

      // Send via Resend instead of Firebase
      await sendPasswordResetEmail({ to: email, resetLink });
      console.log(`[sendPasswordReset] Reset email sent to ${email}`);
      return { success: true };
    } catch (err) {
      console.error("[sendPasswordReset] Error:", err);
      throw new functions.https.HttpsError("internal", "Failed to send reset email.");
    }
  });