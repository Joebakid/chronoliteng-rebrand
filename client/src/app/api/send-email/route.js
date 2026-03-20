import { Resend } from 'resend';
import { NextResponse } from 'next/server';
// Importing the templates we moved to the library
import { 
  getVerificationHtml, 
  getWelcomeHtml, 
  getAdminAlertHtml, 
  getResetHtml 
} from '@/lib/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Chronoliteng <hello@chronolite.com.ng>";
const ADMIN_EMAIL = "chronoliteng@gmail.com";

export async function POST(req) {
  try {
    const { to, subject, htmlType, data } = await req.json();
    let htmlBody = "";

    // --- Template Dispatcher ---
    // This logic picks the correct HTML from your library based on the request
    switch (htmlType) {
      case 'verify':
        htmlBody = getVerificationHtml(data.name, data.code);
        break;
      case 'welcome':
        htmlBody = getWelcomeHtml(data.name);
        break;
      case 'admin_alert':
        htmlBody = getAdminAlertHtml(data.name, data.email);
        break;
      case 'reset':
        htmlBody = getResetHtml(data.email);
        break;
      default:
        // Fallback for simple text emails
        htmlBody = `<p style="font-family:sans-serif; color:#ffffff;">${subject}</p>`;
    }

    // --- Recipient Logic ---
    // If it's an admin alert, send it to you. Otherwise, send it to the user.
    const recipient = htmlType === 'admin_alert' ? ADMIN_EMAIL : to;

    // --- Execution ---
    const { error } = await resend.emails.send({
      from: FROM,
      to: [recipient],
      subject: subject,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email Route Crash:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}