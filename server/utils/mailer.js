import { Resend } from "resend";

export async function sendEmail({ to, subject, html, text }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is missing from environment configuration");
  }
  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Chronolite <no-reply@chronolite.ng>",
    to,
    subject,
    html,
    text,
  });
}