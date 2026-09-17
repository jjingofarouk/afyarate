/**
 * Medical Opportunities Hub Uganda — job alert digest sender.
 * Usage:  node scripts/send_job_alerts.mjs [--dry] [--to email] [--force]
 *
 * Reads active rows from public.job_alerts, matches newly published listings
 * against each alert's keyword / cadre / category / location, and emails the
 * matches. Every (alert, listing) pair actually sent is recorded in
 * public.job_alert_sends so nothing is ever sent twice and frequency
 * (daily | weekly) is honoured without extra local state.
 *
 * Intended to be run from cron (e.g. hourly). The due-check is time-based, so
 * running it more often than daily is harmless: an alert simply will not be
 * due again until its window has elapsed.
 */

import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib_env.mjs";

loadEnv();

const args = process.argv.slice(2);
const DRY = args.includes("--dry") || args.includes("--dry-run");
const FORCE = args.includes("--force");
const toIdx = args.indexOf("--to");
const TO_ONLY = toIdx >= 0 ? args[toIdx + 1] : null;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ratemusawo.online";
const MAX_MATCHES = 8;

// How long after a send an alert becomes due again. Slightly under the nominal
// period so a cron that runs a few minutes early still fires the same day.
const DUE_MS = { daily: 20 * 60 * 60 * 1000, weekly: 6.5 * 24 * 60 * 60 * 1000 };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

const norm = (s) => (s ?? "").toString().toLowerCase().trim();

function matches(alert, post) {
  // Keyword: every word must appear somewhere in the post's search text.
  if (alert.keyword) {
    const words = norm(alert.keyword).split(/\s+/).filter(Boolean);
    const hay = [post.search_text, post.title, post.organization, post.profession, post.location]
      .map(norm)
      .join(" ");
    if (words.some((w) => !hay.includes(w))) return false;
  }
  if (alert.cadre && !norm(post.profession).includes(norm(alert.cadre))) return false;
  if (alert.category && !norm(post.category).includes(norm(alert.category))) return false;
  if (alert.location && !norm(post.location).includes(norm(alert.location))) return false;
  return true;
}

function escapeHtml(s) {
  return (s ?? "").toString().replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const ms = new Date(`${deadline}T23:59:59Z`).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function buildEmail(alert, posts) {
  const label = [alert.keyword, alert.cadre, alert.category, alert.location]
    .filter(Boolean)
    .join(" · ") || "all new listings";

  const rows = posts
    .map((p) => {
      const left = daysLeft(p.deadline);
      const deadline =
        left === null
          ? "Rolling"
          : left <= 0
            ? "Closing today"
            : `${left} day${left === 1 ? "" : "s"} left`;
      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
          <a href="${SITE}/posts/${encodeURIComponent(p.slug)}"
             style="font-size:15px;font-weight:700;color:#047857;text-decoration:none;">
            ${escapeHtml(p.title)}
          </a>
          <div style="margin-top:4px;font-size:13px;color:#475569;">
            ${escapeHtml(p.organization)}${p.location ? ` · ${escapeHtml(p.location)}` : ""}
          </div>
          <div style="margin-top:4px;font-size:12px;color:#94a3b8;">
            ${escapeHtml(p.type)} · ${deadline}
          </div>
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#059669;">
        Medical Opportunities Hub Uganda
      </p>
      <h1 style="margin:8px 0 0;font-size:20px;color:#0f172a;">
        ${posts.length} new opportunit${posts.length === 1 ? "y" : "ies"} for you
      </h1>
      <p style="margin:6px 0 0;font-size:13px;color:#64748b;">
        Matching your alert: <strong>${escapeHtml(label)}</strong>
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:8px;">
        ${rows}
      </table>
      <a href="${SITE}/posts"
         style="display:inline-block;margin-top:20px;background:#059669;color:#fff;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
        See all listings
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
        You receive this because you set a ${escapeHtml(alert.frequency)} job alert on
        Medical Opportunities Hub Uganda. Never pay anyone to secure an opportunity.<br/>
        <a href="${SITE}/alerts" style="color:#94a3b8;">Manage or unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`;
}

async function sendWithRetry(mail) {
  try {
    return await transporter.sendMail(mail);
  } catch (err) {
    console.warn(`  transient send failure (${err.message}), retrying once…`);
    await new Promise((r) => setTimeout(r, 4000));
    return transporter.sendMail(mail);
  }
}

async function main() {
  const { data: alerts, error: alertErr } = await supabase
    .from("job_alerts")
    .select("id, email, keyword, category, cadre, location, frequency")
    .eq("active", true)
    .limit(5000);
  if (alertErr) throw new Error(`Could not load job alerts: ${alertErr.message}`);
  if (!alerts || alerts.length === 0) {
    console.log("No active job alerts.");
    return;
  }

  // Only listings that are live and not already past their deadline.
  const since = new Date(Date.now() - 45 * 86400000).toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const { data: posts, error: postErr } = await supabase
    .from("posts")
    .select("id, slug, type, title, organization, category, profession, location, deadline, search_text, published_at")
    .eq("status", "published")
    .gte("published_at", since)
    .or(`deadline.is.null,deadline.gte.${today}`)
    .order("published_at", { ascending: false })
    .limit(2000);
  if (postErr) throw new Error(`Could not load posts: ${postErr.message}`);
  if (!posts || posts.length === 0) {
    console.log("No recent published listings.");
    return;
  }

  // How each alert was last sent, for the frequency window.
  const { data: sends } = await supabase
    .from("job_alert_sends")
    .select("alert_id, sent_at")
    .order("sent_at", { ascending: false })
    .limit(50000);
  const lastSent = new Map();
  for (const s of sends ?? []) {
    if (!lastSent.has(s.alert_id)) lastSent.set(s.alert_id, s.sent_at);
  }

  let sent = 0;
  let skipped = 0;

  for (const alert of alerts) {
    if (TO_ONLY && norm(alert.email) !== norm(TO_ONLY)) continue;

    const last = lastSent.get(alert.id);
    if (!FORCE && !DRY && last) {
      const due = DUE_MS[alert.frequency] ?? DUE_MS.daily;
      if (Date.now() - new Date(last).getTime() < due) {
        skipped += 1;
        continue;
      }
    }

    const { data: already } = await supabase
      .from("job_alert_sends")
      .select("post_id")
      .eq("alert_id", alert.id);
    const seen = new Set((already ?? []).map((r) => r.post_id));

    const hits = posts
      .filter((p) => !seen.has(p.id) && matches(alert, p))
      .slice(0, MAX_MATCHES);

    if (hits.length === 0) continue;

    if (DRY) {
      console.log(`[dry] ${alert.email} (${alert.frequency}) → ${hits.length} match(es)`);
      for (const h of hits) console.log(`      · ${h.title}`);
      continue;
    }

    await sendWithRetry({
      from: `"Medical Opportunities Hub Uganda" <${process.env.GMAIL_USER}>`,
      to: alert.email,
      subject:
        hits.length === 1
          ? `New opportunity: ${hits[0].title}`
          : `${hits.length} new opportunities matching your alert`,
      html: buildEmail(alert, hits),
    });

    await supabase
      .from("job_alert_sends")
      .upsert(
        hits.map((h) => ({ alert_id: alert.id, post_id: h.id })),
        { onConflict: "alert_id,post_id", ignoreDuplicates: true },
      );

    sent += 1;
    console.log(`✓ ${alert.email} → ${hits.length} listing(s)`);
  }

  console.log(`\nDone. Alerts emailed: ${sent}. Not due yet: ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
