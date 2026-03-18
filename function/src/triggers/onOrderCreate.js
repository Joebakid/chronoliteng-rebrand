const functions = require("firebase-functions");
const { 
  resendKeySecret, 
  sendOrderConfirmationEmail, 
  sendNewOrderAlertEmail 
} = require("../lib/resend");

exports.onOrderCreate = functions
  .runWith({ secrets: [resendKeySecret] })
  .firestore.document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    const { userEmail, userName, items, total, paymentMethod } = order;

    try {
      // Send confirmation to customer
      if (userEmail) {
        await sendOrderConfirmationEmail({
          to: userEmail,
          name: userName,
          orderId,
          items,
          total,
          paymentMethod,
        });
        console.log(`[onOrderCreate] Confirmation sent to ${userEmail}`);
      }

      // Send alert to admin
      await sendNewOrderAlertEmail({
        orderId,
        customerName: userName,
        customerEmail: userEmail,
        items,
        total,
        paymentMethod,
      });
      console.log(`[onOrderCreate] Admin alert sent`);
    } catch (err) {
      console.error("[onOrderCreate] Email error:", err);
    }
  });