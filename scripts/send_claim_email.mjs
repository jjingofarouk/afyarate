/**
 * Rate Musawo, one-off claim-profile email sender.
 * Usage:
 *   node scripts/send_claim_email.mjs --dry    # preview subject + HTML, send nothing
 *   node scripts/send_claim_email.mjs --send   # actually send via Gmail
 *
 * EDIT THE EMAIL BELOW (subject + body copy) before sending. Nothing sends
 * unless --send is passed.
 */
import nodemailer from "nodemailer";
import { loadEnv } from "./lib_env.mjs";

loadEnv();

const args = process.argv.slice(2);
const SEND = args.includes("--send");

// ── Edit me ──────────────────────────────────────────────────────────────
const TO = "linhomalk@gmail.com";
const SUBJECT = "Your Rate Musawo verified profile is live - complete payment within 48hrs";

const SITE = "https://ratemusawo.online";
const PROFILE_URL = `${SITE}/practitioners/407036`;
const EDIT_URL =
  `${SITE}/practitioners/407036/edit?t=f7ae1daf98c641108b21a726e7877eb05c18f8d98cea46759bb8fe0f9df41667`;
const PAY_NUMBER = "+256777421601";
const AMOUNT = "UGX 5,000";
// ──────────────────────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${SUBJECT}</title>
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
          <p style="margin:3px 0 0;font-size:12px;color:#86efac;letter-spacing:0.2px;">Jobs, grants, scholarships, fellowships, conferences, & more for Uganda's health workers</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 24px 24px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
            Hello <strong>Colline Lule</strong>,
          </p>
          <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
            Good news, your claimed profile on Rate Musawo is now live. It shows your
            verified licence badge (Allied Health Professionals Council, Clinical Officer)
            together with your phone and WhatsApp <strong>+256705264361</strong>, so patients
            can reach you directly with no middleman.
          </p>

          <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
            <tr><td style="border-radius:10px;background:#059669;">
              <a href="${PROFILE_URL}"
                style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                View your profile →
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
            <strong>Share your link to get rated:</strong> send this link to your patients and
            colleagues so they can rate you and leave feedback:
            <a href="${PROFILE_URL}" style="color:#059669;font-weight:600;text-decoration:none;">${PROFILE_URL}</a>.
            More ratings move you up in search and bring you more patients.
          </p>
          <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
            <strong>Make it shine:</strong> add your workplace, specialties and a short bio here:
            <a href="${EDIT_URL}" style="color:#059669;font-weight:600;text-decoration:none;">edit your profile</a>.
            (This link is personal to you, don't share it.)
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;"><tr><td style="background:#fef3c7;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#92400e;">
              Payment due within 48 hours
            </p>
            <p style="margin:0;font-size:14px;color:#92400e;line-height:1.7;">
              Please send the one-time fee of <strong>${AMOUNT}</strong> to
              <strong>${PAY_NUMBER}</strong> (MTN / Airtel Money), then reply to this
              email with your transaction ID so we can attach your receipt.
              If payment is not received within 48 hours, the profile will be unclaimed
              until payment is confirmed.
            </p>
          </td></tr></table>

          <p style="margin:20px 0 0;font-size:15px;color:#374151;line-height:1.7;">
            Thank you for joining Rate Musawo.<br>
            Best regards,<br>
            <strong>Rate Musawo Team</strong>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:16px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
            Questions? Just reply to this email.
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            <a href="${SITE}" style="color:#6b7280;text-decoration:none;">ratemusawo.online</a>
            &nbsp;·&nbsp;
            <a href="mailto:${process.env.GMAIL_USER}" style="color:#6b7280;text-decoration:none;">Contact us</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const text = `Hello Colline Lule,

Good news, your claimed profile on Rate Musawo is now live:
${PROFILE_URL}

It shows your verified licence badge (Allied Health Professionals Council, Clinical Officer) together with your phone and WhatsApp +256705264361, so patients can reach you directly with no middleman.

Share your link to get rated: send ${PROFILE_URL} to your patients and colleagues so they can rate you. More ratings move you up in search and bring you more patients.

Make it shine: add your workplace, specialties and a short bio here (personal link, don't share it):
${EDIT_URL}

PAYMENT, due within 48 hours: please send the one-time fee of ${AMOUNT} to ${PAY_NUMBER} (MTN / Airtel Money), then reply to this email with your transaction ID so we can attach your receipt. If payment is not received within 48 hours, the profile will be unclaimed until payment is confirmed.

Thank you for joining Rate Musawo.
Best regards,
Rate Musawo Team`;

if (!SEND) {
  console.log(`TO: ${TO}\nSUBJECT: ${SUBJECT}\n`);
  console.log(text);
  console.log("\n(DRY RUN — nothing sent. Pass --send to actually send.)");
  process.exit(0);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

try {
  await transporter.sendMail({
    from: `"Rate Musawo" <${process.env.GMAIL_USER}>`,
    to: TO,
    subject: SUBJECT,
    text,
    html,
  });
  console.log(`SENT to ${TO}`);
} catch (err) {
  console.error(`SEND FAILED: ${err.message}`);
  process.exit(1);
}
