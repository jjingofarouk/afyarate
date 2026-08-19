/**
 * Rate Musawo — local newsletter sender.
 * Usage:  node scripts/send_newsletter.mjs [--dry-run] [--since YYYY-MM-DD] [--to email]
 *
 * Sends ONE featured opportunity per subscriber based on their preferences.
 * Run locally; subscribers are stored in Supabase.
 */

import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib_env.mjs";

loadEnv();

// ── CLI flags ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const sinceIdx = args.indexOf("--since");
const SINCE = sinceIdx >= 0 ? args[sinceIdx + 1] : null;
const toIdx = args.indexOf("--to");
const TO_ONLY = toIdx >= 0 ? args[toIdx + 1] : null;

const sinceDate = SINCE
  ? new Date(SINCE)
  : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const SITE = "https://ratemusawo.online";

// ── Clients ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Preference matching ────────────────────────────────────────────────────
const TYPE_MAP = {
  Jobs: "job",
  Internships: "internship",
  Scholarships: "scholarship",
  Grants: "grant",
  Fellowships: "fellowship",
  Conferences: "conference",
};

function pickBestPost(posts, sub) {
  const wantedTypes = sub.opportunity_types?.length
    ? sub.opportunity_types.map((t) => TYPE_MAP[t]).filter(Boolean)
    : Object.values(TYPE_MAP);

  const matched = posts.filter((p) => {
    if (!wantedTypes.includes(p.type)) return false;
    if (sub.roles?.length && p.profession) {
      const prof = p.profession.toLowerCase();
      const hit = sub.roles.some((r) => prof.includes(r.split(" ")[0].toLowerCase()));
      if (!hit) return false;
    }
    if (sub.regions?.length && p.location) {
      const loc = p.location.toLowerCase();
      const hit = sub.regions.some((r) =>
        loc.includes(r.replace(" Uganda", "").toLowerCase()),
      );
      if (!hit) return false;
    }
    return true;
  });

  if (!matched.length) return null;
  // Featured first, then newest
  return matched.find((p) => p.featured) ?? matched[0];
}

// ── Varied greeting messages ───────────────────────────────────────────────
const MESSAGES = [
  "We found something that lines up with your profile. Take a look.",
  "One opportunity, carefully picked for you this week. Good luck! 🤞",
  "Something fresh came in that fits what you're looking for.",
  "We do the scanning so you don't have to — here's your match.",
  "This one caught our eye and we thought of you straight away.",
  "Your next big step might be right here. Worth a read.",
  "Opportunities like this don't stay open long — have a look.",
  "We spotted something that aligns well with where you're headed.",
  "Here's a listing that fits your profile. The rest is yours to take forward.",
  "A new door might be opening. We found this one for you.",
  "We went through hundreds of listings so you only see what matters.",
  "Health workers build Uganda. Here's something that could build your career too.",
  "Your skills deserve the right stage. Here's one possibility.",
  "Not every listing is worth your time — this one might be.",
  "One solid match this week. Give it a look when you can.",
  "Career moves start with a single listing. Here's yours. 🌿",
  "We think you'd be a great fit for this one. See what you think.",
  "Something new landed that matches your interests — check it out.",
  "Sometimes the right opportunity just needs the right person. That could be you.",
  "Here's this week's pick. We hope it leads somewhere great for you.",
  "Good things are out there. Here's one we found for you. 🙏",
  "We picked just one this week, and this is it. Worth your time.",
  "Keep your eyes on this one — it lines up with your profile nicely.",
  "A fresh opportunity matched for you. Go see what it's about.",
  "This week's highlight. We hope it's exactly what you need.",
  "We're rooting for you. Here's a match we think is worth pursuing. 💪",
  "Your profile pointed us straight to this listing.",
  "Here's something we think deserves your attention this week.",
  "One opportunity, one week — make it count. Best of luck! 🌟",
  "We found a match. Now over to you — you've got this.",
  "Something aligned with your preferences just came through.",
  "Here's a listing that felt right for someone with your background.",
  "We hope this one opens a door for you. Check it out. 🚀",
  "Wishing you the very best with this opportunity. Go get it.",
  "Your next chapter might start with this. Take a look.",
  "We curated one just for you this week. We think it's a good one.",
  "Every opportunity starts as just a listing. This one's yours.",
  "We're always looking out for you. Here's what we found this week.",
  "This could be exactly what you've been waiting for. 🌱",
  "A well-matched opportunity just for you. Good luck out there!",
];

function pickMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

// ── Email template ─────────────────────────────────────────────────────────
const TYPE_COLORS = {
  job:          { bg: "#dcfce7", text: "#166534", label: "Job" },
  internship:   { bg: "#dbeafe", text: "#1e40af", label: "Internship" },
  scholarship:  { bg: "#fef9c3", text: "#854d0e", label: "Scholarship" },
  grant:        { bg: "#ede9fe", text: "#5b21b6", label: "Grant" },
  fellowship:   { bg: "#ffedd5", text: "#9a3412", label: "Fellowship" },
  conference:   { bg: "#fce7f3", text: "#9d174d", label: "Conference" },
  opportunity:  { bg: "#e0f2fe", text: "#075985", label: "Opportunity" },
  other:        { bg: "#f3f4f6", text: "#374151", label: "Other" },
};

function buildEmail(sub, post) {
  const name = sub.first_name ? sub.first_name.trim() : "there";
  const color = TYPE_COLORS[post.type] ?? TYPE_COLORS.other;
  const postUrl = `${SITE}/posts/${post.slug}`;

  const deadline = post.deadline
    ? `<tr><td style="padding:0 0 8px;">
        <span style="font-size:13px;color:#6b7280;">⏰ Deadline: <strong style="color:#dc2626;">${post.deadline}</strong></span>
      </td></tr>`
    : "";

  const location = post.location
    ? `<tr><td style="padding:0 0 8px;">
        <span style="font-size:13px;color:#6b7280;">📍 ${post.location}</span>
      </td></tr>`
    : "";

  const summary = post.summary
    ? `<tr><td style="padding:16px 0 0;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">${post.summary.slice(0, 220)}${post.summary.length > 220 ? "…" : ""}</p>
      </td></tr>`
    : "";

  const message = pickMessage();
  const hasImage = !!post.image_url;
  const subject = `${color.label}: ${post.title} at ${post.organization} — Rate Musawo`;

  // Per-cell border-radius (overflow:hidden is unreliable in email clients)
  const imgRadius   = "border-radius:10px 10px 0 0;";
  const badgeRadius = hasImage ? "" : "border-radius:10px 10px 0 0;";
  const bodyRadius  = "border-radius:0 0 10px 10px;";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
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

        <!-- Greeting -->
        <tr><td style="background:#ffffff;padding:24px 24px 16px;">
          <p style="margin:0;font-size:16px;color:#111827;">Hi <strong>${name}</strong>,</p>
          <p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">${message}</p>
        </td></tr>

        <!-- Opportunity card -->
        <tr><td style="background:#ffffff;padding:0 24px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">

            ${hasImage ? `<tr><td style="border:1px solid #e5e7eb;border-bottom:none;${imgRadius}padding:0;line-height:0;">
              <img src="${post.image_url}" alt="${post.title}" width="100%"
                style="display:block;width:100%;height:200px;object-fit:cover;${imgRadius}">
            </td></tr>` : ""}

            <tr><td style="border:1px solid #e5e7eb;border-bottom:none;${hasImage ? "" : badgeRadius}background:${color.bg};padding:8px 20px;">
              <span style="font-size:11px;font-weight:700;color:${color.text};text-transform:uppercase;letter-spacing:0.8px;">${color.label}</span>
            </td></tr>

            <tr><td style="border:1px solid #e5e7eb;${bodyRadius}padding:20px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 0 4px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#111827;line-height:1.3;">${post.title}</p>
                </td></tr>
                <tr><td style="padding:0 0 14px;">
                  <p style="margin:0;font-size:14px;color:#374151;font-weight:500;">${post.organization}</p>
                </td></tr>
                ${location}
                ${deadline}
                ${summary}
                <tr><td style="padding:20px 0 0;">
                  <a href="${postUrl}"
                    style="display:inline-block;background:#0f4c24;color:#ffffff;font-size:14px;font-weight:600;
                           padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">
                    View Full Details →
                  </a>
                </td></tr>
              </table>
            </td></tr>

          </table>
        </td></tr>

        <!-- Browse more -->
        <tr><td style="background:#ffffff;padding:4px 24px 24px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Want to see more?&nbsp;
            <a href="${SITE}/posts" style="color:#0f4c24;font-weight:600;text-decoration:none;">Browse all opportunities</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
            You're receiving this because you subscribed to Rate Musawo opportunity alerts.
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

  return { subject, html };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nRate Musawo Newsletter — ${DRY_RUN ? "DRY RUN" : "LIVE SEND"}`);
  console.log(`Fetching posts since ${sinceDate.toISOString().slice(0, 10)}\n`);

  const { data: posts, error: postsErr } = await supabase
    .from("posts")
    .select("id,slug,type,title,organization,location,profession,deadline,summary,featured,image_url,published_at")
    .eq("status", "published")
    .gte("published_at", sinceDate.toISOString())
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (postsErr) { console.error("Posts fetch failed:", postsErr.message); process.exit(1); }
  console.log(`Found ${posts.length} recent post(s).`);
  if (!posts.length) { console.log("Nothing to send."); return; }

  const { data: subscribers, error: subErr } = await supabase
    .from("newsletter_subscribers")
    .select("email,first_name,opportunity_types,roles,regions")
    .eq("status", "subscribed");

  if (subErr) { console.error("Subscribers fetch failed:", subErr.message); process.exit(1); }

  const targets = TO_ONLY
    ? subscribers.filter((s) => s.email === TO_ONLY)
    : subscribers;

  console.log(`${subscribers.length} subscriber(s)${TO_ONLY ? ` → filtered to ${TO_ONLY}` : ""}.\n`);

  let sent = 0, skipped = 0;

  for (const sub of targets) {
    const post = pickBestPost(posts, sub);

    if (!post) {
      console.log(`  SKIP   ${sub.email} — no matching post`);
      skipped++;
      continue;
    }

    const { subject, html } = buildEmail(sub, post);

    if (DRY_RUN) {
      console.log(`  [DRY]  ${sub.email} — "${post.title}" (${post.type})`);
      sent++;
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"Rate Musawo" <${process.env.GMAIL_USER}>`,
        to: sub.email,
        subject,
        html,
      });
      console.log(`  SENT   ${sub.email} — "${post.title}"`);
      sent++;
    } catch (err) {
      console.error(`  ERROR  ${sub.email}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone. Sent: ${sent}, Skipped: ${skipped}`);
}

main();
