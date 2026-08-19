import nodemailer from "nodemailer";

const SITE = "https://ratemusawo.online";

function getTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });
}

export async function sendWelcomeEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const name = firstName || "there";
  const manageUrl = `${SITE}/newsletter/manage?email=${encodeURIComponent(email)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Rate Musawo</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:20px 8px 32px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">

        <!-- Header -->
        <tr><td style="background:#0f4c24;border-radius:12px 12px 0 0;padding:20px 24px;text-align:center;">
          <img src="${SITE}/logo.png" alt="Rate Musawo" width="52" height="52"
            style="border-radius:8px;display:block;margin:0 auto 10px;">
          <p style="margin:0;font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rate Musawo</p>
          <p style="margin:3px 0 0;font-size:11px;color:#86efac;letter-spacing:0.6px;text-transform:uppercase;">Uganda's Health Worker Hub</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 24px 24px;">
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">You're in, ${name}! 🎉</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Welcome to Rate Musawo — Uganda's hub for health worker jobs, scholarships, grants, fellowships and conferences.
            We'll send you matched opportunities straight to your inbox, based on your role and region.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Emails go out up to three times a day, and only when there's something worth sharing.
          </p>

          <!-- Manage button -->
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border-radius:10px;background:#059669;">
              <a href="${manageUrl}"
                style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                Manage my preferences →
              </a>
            </td></tr>
          </table>

          <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
            You can update what we send you or unsubscribe at any time using the link above.<br>
            Questions? Just reply to this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:16px 24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
            You subscribed at <a href="${SITE}" style="color:#6b7280;text-decoration:none;">ratemusawo.online</a>
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            <a href="${manageUrl}" style="color:#6b7280;text-decoration:none;">Manage preferences</a>
            &nbsp;·&nbsp;
            <a href="mailto:${process.env.GMAIL_USER}" style="color:#6b7280;text-decoration:none;">Contact us</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await getTransport().sendMail({
    from: `Rate Musawo <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Welcome to Rate Musawo — you're subscribed!",
    html,
  });
}
