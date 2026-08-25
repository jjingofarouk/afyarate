/**
 * Rate Musawo, local newsletter sender.
 * Usage:  node scripts/send_newsletter.mjs [--dry] [--to email] [--reset] [--force]
 *
 * Sends ONE featured opportunity per subscriber based on their preferences.
 * Run locally; subscribers are stored in Supabase.
 *
 * Meant to be invoked frequently (e.g. every 15 min) by cron so that a
 * missed run (Mac asleep at the scheduled slot) gets caught the moment the
 * machine wakes. A stamp file guarantees each of today's slots sends at
 * most once, regardless of how many times this fires. See dueSlot() below.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib_env.mjs";

loadEnv();

// ── CLI flags ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run") || args.includes("--dry");
const RESET   = args.includes("--reset");
const FORCE   = args.includes("--force");
const toIdx   = args.indexOf("--to");
const TO_ONLY = toIdx >= 0 ? args[toIdx + 1] : null;

const SITE = "https://ratemusawo.online";

// ── Twice-daily guard ────────────────────────────────────────────────────
// Two slots, EAT: 09:30 and 19:00. Stamp file (JSON) records today's date
// plus which slot ids already sent, so retries within the same day no-op.
// If the Mac was asleep through multiple due slots, only the most recent
// one actually sends (catch-up never fires two emails back to back); the
// earlier missed slot(s) are marked consumed without sending.
const SEND_SLOTS = [
  { id: "morning", hour: 9, minute: 30 },
  { id: "evening", hour: 19, minute: 0 },
];
const __dirname = dirname(fileURLToPath(import.meta.url));
const STAMP_FILE = join(__dirname, "..", ".newsletter-last-sent");

function todayEAT() {
  return eatNow().toISOString().slice(0, 10);
}

function minutesNowEAT() {
  const d = eatNow();
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function readStamp() {
  if (!existsSync(STAMP_FILE)) return { date: null, sent: [] };
  try {
    return JSON.parse(readFileSync(STAMP_FILE, "utf8"));
  } catch {
    return { date: null, sent: [] };
  }
}

/** Returns the slot to send for right now, or null if nothing is due. */
async function dueSlot() {
  const today = todayEAT();
  const stamp = await syncStamps();
  const sentToday = stamp.date === today ? new Set(stamp.sent) : new Set();
  const nowMin = minutesNowEAT();

  const due = SEND_SLOTS.filter((s) => nowMin >= s.hour * 60 + s.minute && !sentToday.has(s.id));
  if (!due.length) return null;
  return due[due.length - 1]; // most recent due slot only
}

// Slot progress is mirrored to Supabase (newsletter_runtime) so it can be
// audited remotely and survives a lost/stale stamp file. The local file
// stays the fast path; the two are unioned before deciding what's due.
async function loadRemoteStamp() {
  try {
    const { data, error } = await supabase
      .from("newsletter_runtime")
      .select("data")
      .eq("key", "slots")
      .maybeSingle();
    if (error || !data?.data) return null;
    return data.data;
  } catch {
    return null; // remote state is best-effort
  }
}

async function saveRemoteStamp(stamp) {
  try {
    await supabase
      .from("newsletter_runtime")
      .upsert({ key: "slots", data: stamp, updated_at: new Date().toISOString() }, { onConflict: "key" });
  } catch (err) {
    console.warn("(remote stamp save skipped):", err.message);
  }
}

async function syncStamps() {
  const local = readStamp();
  const remote = await loadRemoteStamp();
  if (!remote) return local;
  const today = todayEAT();

  let merged;
  if (local.date === today && remote.date === today) {
    merged = { date: today, sent: [...new Set([...(local.sent ?? []), ...(remote.sent ?? [])])] };
  } else if (remote.date === today) {
    merged = { date: today, sent: remote.sent ?? [] };
  } else {
    return local;
  }
  try {
    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      writeFileSync(STAMP_FILE, JSON.stringify(merged));
    }
  } catch {}
  return merged;
}

/** Marks every slot up to and including `slot` as consumed for today. */
async function markSlotSent(slot) {
  const today = todayEAT();
  const stamp = readStamp();
  const sentToday = stamp.date === today ? new Set(stamp.sent) : new Set();
  const idx = SEND_SLOTS.findIndex((s) => s.id === slot.id);
  for (let i = 0; i <= idx; i++) sentToday.add(SEND_SLOTS[i].id);
  try {
    writeFileSync(STAMP_FILE, JSON.stringify({ date: today, sent: [...sentToday] }));
  } catch (err) {
    console.warn("Could not write stamp file:", err.message);
  }
  await saveRemoteStamp(readStamp());
}

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

// ── Deduplication ─────────────────────────────────────────────────────────
// Never repeat a listing to the same user — this is a hard guarantee.
// History lives in newsletter_sends (unique on email+post_slug). We query
// it filtered in chunks of subscribers instead of SELECT *: unfiltered
// selects silently cap at 1000 rows, which would break dedup once the
// history table grows past that.
const CHUNK_SIZE = 150;

async function fetchSentSlugs(emails) {
  const map = {};
  for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
    const { data, error } = await supabase
      .from("newsletter_sends")
      .select("email, post_slug")
      .in("email", emails.slice(i, i + CHUNK_SIZE));
    if (error) {
      // A partial/failed read means we might repeat a listing. Abort the
      // whole run rather than risk violating the no-repeat rule.
      throw new Error(`Send-history fetch failed (dedup aborted): ${error.message}`);
    }
    for (const row of data ?? []) {
      (map[row.email] ??= new Set()).add(row.post_slug);
    }
  }
  return map;
}

async function recordSend(email, postSlug) {
  const { error } = await supabase
    .from("newsletter_sends")
    .upsert(
      { email, post_slug: postSlug, sent_at: new Date().toISOString() },
      { onConflict: "email,post_slug", ignoreDuplicates: true },
    );
  if (error) console.warn(`  WARN   failed to record send for ${email}:`, error.message);
}

// ── Preference matching ────────────────────────────────────────────────────
const TYPE_MAP = {
  Jobs: "job",
  Internships: "internship",
  Scholarships: "scholarship",
  Grants: "grant",
  Fellowships: "fellowship",
  Conferences: "conference",
};

// Roles that are the same job under different labels across postings.
// Selecting either one also matches the other.
const ROLE_SYNONYMS = {
  doctor: ["medical officer"],
  "medical officer": ["doctor"],
};

function roleMatchesProfession(role, prof) {
  const r = role.toLowerCase();
  if (prof.includes(r.split(" ")[0])) return true;
  return (ROLE_SYNONYMS[r] ?? []).some((syn) => prof.includes(syn));
}

function pickBestPost(posts, sub, alreadySent = new Set()) {
  const wantedTypes = sub.opportunity_types?.length
    ? sub.opportunity_types.map((t) => TYPE_MAP[t]).filter(Boolean)
    : Object.values(TYPE_MAP);

  const matched = posts.filter((p) => {
    if (alreadySent.has(p.slug)) return false;
    if (!wantedTypes.includes(p.type)) return false;
    if (sub.roles?.length && p.profession) {
      const prof = p.profession.toLowerCase();
      const hit = sub.roles.some((r) => roleMatchesProfession(r, prof));
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
  // Featured first, then freshness — but ties are broken deterministically
  // per subscriber/day so different subscribers receive different strong
  // matches instead of everyone getting the identical listing.
  const seed = hashStr(`${sub.email}|${todayEAT()}`);
  const freshnessScore = (iso) => {
    if (!iso) return 0;
    const ageDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    return Math.max(0, 100 - 5 * Math.min(Math.max(ageDays, 0), 20));
  };
  const scored = matched.map((p) => ({
    p,
    s:
      (p.featured ? 10_000 : 0) +
      freshnessScore(p.published_at) +
      ((seed ^ hashStr(p.slug)) % 500),
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].p;
}

// ── Varied greeting messages ───────────────────────────────────────────────
const MESSAGES = [
  "We found something that lines up with your profile. Take a look.",
  "One opportunity, carefully picked for you. Good luck! 🤞",
  "Something fresh came in that fits what you're looking for.",
  "We do the scanning so you don't have to. Here's your match.",
  "This one caught our eye and we thought of you straight away.",
  "Your next big step might be right here. Worth a read.",
  "Opportunities like this don't stay open long. Have a look.",
  "We spotted something that aligns well with where you're headed.",
  "Here's a listing that fits your profile. The rest is yours to take forward.",
  "A new door might be opening. We found this one for you.",
  "We went through hundreds of listings so you only see what matters.",
  "Health workers build Uganda. Here's something that could build your career too.",
  "Your skills deserve the right stage. Here's one possibility.",
  "Not every listing is worth your time. This one might be.",
  "One solid match this send. Give it a look when you can.",
  "Career moves start with a single listing. Here's yours. 🌿",
  "We think you'd be a great fit for this one. See what you think.",
  "Something new landed that matches your interests. Check it out.",
  "Sometimes the right opportunity just needs the right person. That could be you.",
  "Here's today's pick. We hope it leads somewhere great for you.",
  "Good things are out there. Here's one we found for you. 🙏",
  "We picked just one this time, and this is it. Worth your time.",
  "This one lines up with your profile nicely. Take a look.",
  "A fresh opportunity matched for you. Go see what it's about.",
  "Today's highlight. We hope it's exactly what you need.",
  "We're rooting for you. Here's a match we think is worth pursuing. 💪",
  "Your profile pointed us straight to this listing.",
  "Here's something we think deserves your attention.",
  "One opportunity, one send. Make it count! Best of luck! 🌟",
  "We found a match. Now over to you. You've got this.",
  "Something aligned with your preferences just came through.",
  "Here's a listing that felt right for someone with your background.",
  "We hope this one opens a door for you. Check it out. 🚀",
  "Wishing you the very best with this opportunity. Go get it.",
  "Your next chapter might start with this. Take a look.",
  "We curated this one just for you. We think it's a good one.",
  "Every opportunity starts as just a listing. This one's yours.",
  "We're always looking out for you. Here's what we found.",
  "This could be exactly what you've been waiting for. 🌱",
  "A well-matched opportunity just for you. Good luck out there!",
  "We scanned the latest listings and this one had your name on it.",
  "Fresh in and matched to you. Give it a read when you get a chance.",
  "We only send what's relevant. Today, this is it.",
  "Your preferences led us here. We think it's worth your time.",
  "One listing, chosen just for you. Here it is.",
];

const WELCOME_MESSAGES = [
  "We'll send you matched jobs, scholarships, grants and conferences based on your role and region.",
  "From now on you'll hear about opportunities that fit your profile, as soon as they're posted.",
  "Sit back while we go through new listings and send you only the ones that match your preferences.",
  "You'll get notified about new opportunities tailored to you. No noise, just the ones that count.",
  "We pick the best matches for your role and region so you never miss what matters.",
  "Your inbox will now receive curated opportunities that align with where you are and where you're headed.",
  "We send up to three updates a day, and only when something relevant comes up for you.",
];

function pickMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

// ── Match-derived copy ─────────────────────────────────────────────────────
// Generic random lines from shared pools made a single blast feel
// copy-pasted. Instead we compose the intro from what actually matched:
// the subscriber's role/region preferences and the listing itself.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const OPENERS = {
  job: [
    "Good news — a new job matched your profile.",
    "A fresh job opening just landed that fits what you're looking for.",
    "We spotted a new job we think you should see.",
    "There's a new vacancy with your name on it.",
  ],
  internship: [
    "An internship opening just came in for you.",
    "A new internship matched your profile.",
    "Fresh internship alert — take a look.",
  ],
  scholarship: [
    "A scholarship opportunity matched your profile.",
    "Good news — there's a scholarship you may qualify for.",
    "A new funding opportunity for your studies just came in.",
  ],
  grant: [
    "A grant opportunity matched your interests.",
    "Funding alert — this grant could fit your work.",
    "A new grant call just opened that may suit you.",
  ],
  fellowship: [
    "A fellowship opportunity matched your profile.",
    "Good news — a new fellowship call is open.",
    "There's a fellowship we think suits your path.",
  ],
  conference: [
    "A conference matched your professional interests.",
    "Heads up — a relevant conference is coming up.",
    "A new conference opportunity just opened.",
  ],
  default: [
    "Something new matched your profile.",
    "We found an opportunity worth your time.",
    "A fresh opportunity just came in for you.",
  ],
};

function regionHitFor(sub, location) {
  if (!sub.regions?.length || !location) return null;
  const loc = location.toLowerCase();
  return (
    sub.regions
      .map((r) => r.replace(" Uganda", "").trim())
      .find((r) => r && loc.includes(r.toLowerCase())) ?? null
  );
}

function buildMatchMessage(sub, post, seed) {
  const pick = (arr) => arr[seed % arr.length];
  const prof = (post.profession ?? "").toLowerCase();
  const roleHit = prof
    ? (sub.roles ?? []).find((r) => roleMatchesProfession(r, prof)) ?? null
    : null;
  const regionHit = regionHitFor(sub, post.location);
  const urgency = daysUntilDeadline(post.deadline);

  let msg = pick(OPENERS[post.type] ?? OPENERS.default);
  const bits = [];
  if (roleHit) bits.push(`it's in your field (${titleCase(roleHit)})`);
  else if (prof) bits.push(`it's looking for ${prof} professionals`);
  if (regionHit) bits.push(`it's based in ${regionHit}`);
  if (urgency !== null && urgency <= 7) {
    bits.push(`the deadline is only ${urgency} day${urgency === 1 ? "" : "s"} away`);
  }
  if (bits.length) {
    msg += ` ${pick(["Why we flagged it:", "Here's why:", "Quick rundown:"])} ${capitalize(bits.join(", "))}.`;
  }
  return msg;
}

function pickWelcomeMessage() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

// ── Context helpers ─────────────────────────────────────────────────────────

// Uganda = EAT (UTC+3)
function eatNow() {
  return new Date(Date.now() + 3 * 3_600_000);
}

function timeGreeting() {
  const h = eatNow().getUTCHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Hi";
}

function timePeriodLabel() {
  const h = eatNow().getUTCHours();
  if (h >= 5  && h < 12) return "Morning pick";
  if (h >= 12 && h < 17) return "Afternoon match";
  if (h >= 17 && h < 21) return "Evening opportunity";
  return "Latest match";
}

// Computus, Western Easter Sunday
function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, g = Math.floor((b + 8) / 25);
  const h = Math.floor((b - g + 1) / 3);
  const i = (19 * a + b - d - h + 15) % 30;
  const k = Math.floor(c / 4), l = c % 4;
  const m = (32 + 2 * e + 2 * k - i - l) % 7;
  const n = Math.floor((a + 11 * i + 22 * m) / 451);
  const month = Math.floor((i + m - 7 * n + 114) / 31);
  const day   = (i + m - 7 * n + 114) % 31 + 1;
  return new Date(year, month - 1, day);
}

const FIXED_HOLIDAYS = [
  { m: 1,  d: 1,  name: "New Year's Day",           emoji: "🎆" },
  { m: 1,  d: 26, name: "NRM Liberation Day",        emoji: "🇺🇬" },
  { m: 2,  d: 16, name: "Archbishop Luwum Day",      emoji: "🕊️" },
  { m: 3,  d: 8,  name: "International Women's Day", emoji: "💜" },
  { m: 5,  d: 1,  name: "Labour Day",                emoji: "🛠️" },
  { m: 6,  d: 3,  name: "Uganda Martyrs' Day",       emoji: "🕊️" },
  { m: 6,  d: 9,  name: "National Heroes Day",       emoji: "🏆" },
  { m: 10, d: 9,  name: "Independence Day",          emoji: "🇺🇬" },
  { m: 12, d: 25, name: "Christmas Day",             emoji: "🎄" },
  { m: 12, d: 26, name: "Boxing Day",                emoji: "🎁" },
];

function todayHoliday() {
  const now = eatNow();
  const m = now.getUTCMonth() + 1, d = now.getUTCDate(), y = now.getUTCFullYear();
  const fixed = FIXED_HOLIDAYS.find(h => h.m === m && h.d === d);
  if (fixed) return fixed;
  const easter = easterSunday(y);
  const gf = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
  const em = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);
  if (m === gf.getMonth() + 1 && d === gf.getDate()) return { name: "Good Friday",  emoji: "✝️" };
  if (m === em.getMonth() + 1 && d === em.getDate()) return { name: "Easter Monday", emoji: "✝️" };
  return null;
}

function daysUntilDeadline(str) {
  if (!str) return null;
  const t = new Date(str).getTime();
  if (isNaN(t)) return null;
  const days = Math.ceil((t - Date.now()) / 86_400_000);
  return days > 0 ? days : null;
}

function postedAge(iso) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days <= 6) return `Posted ${days} days ago`;
  return null;
}

const DOW_MESSAGES = {
  0: [ // Sunday
    "Sunday planning mode? Here's an opportunity to keep on your radar.",
    "Before the week starts, here's something worth knowing about.",
    "A quiet Sunday read. This one came in and we think it's worth your time.",
  ],
  1: [ // Monday
    "Fresh week, fresh opportunity. Here's today's pick for you.",
    "Start the week on the front foot. Here's your match.",
    "New week, new listing. Here's what we found for you.",
    "Monday is a good day to make a move. Here's your match.",
  ],
  3: [ // Wednesday
    "Midweek and there's already something worth sharing.",
    "Wednesday brought something interesting your way.",
    "Halfway through the week. Here's a new listing for you.",
  ],
  5: [ // Friday
    "Head into the weekend knowing about this one.",
    "End the week on a strong note. Here's your match.",
    "Before you switch off for the weekend, check this out.",
    "Friday pick, matched just for you.",
  ],
  6: [ // Saturday
    "Weekend browsing? This one might be worth it.",
    "A little Saturday reading. We think you'd be interested.",
    "Spotted this one and thought of you. Weekend edition.",
  ],
};

function pickContextMessage(dow) {
  const pool = DOW_MESSAGES[dow];
  if (pool) return pool[Math.floor(Math.random() * pool.length)];
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
        <span style="font-size:14px;color:#6b7280;">⏰ Deadline: <strong style="color:#dc2626;">${post.deadline}</strong></span>
      </td></tr>`
    : "";

  const location = post.location
    ? `<tr><td style="padding:0 0 8px;">
        <span style="font-size:14px;color:#6b7280;">📍 ${post.location}</span>
      </td></tr>`
    : "";

  const summary = post.summary
    ? `<tr><td style="padding:16px 0 0;">
        <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">${post.summary.slice(0, 220)}${post.summary.length > 220 ? "…" : ""}</p>
      </td></tr>`
    : "";

  // Context-aware variables
  const dow         = eatNow().getUTCDay();
  const greeting    = timeGreeting();
  const seed        = hashStr(`${sub.email}|${post.slug}`);
  const message     = buildMatchMessage(sub, post, seed);
  const holiday     = todayHoliday();
  const urgencyDays = daysUntilDeadline(post.deadline);
  const regionHit   = regionHitFor(sub, post.location);
  const age         = postedAge(post.published_at);
  const hasImage    = !!post.image_url;
  // Personalized subject: lead with the match, add urgency or place.
  // Holiday greeting overrides everything for the day.
  const subjectCore = [
    `${color.label}: ${post.title}`,
    urgencyDays !== null && urgencyDays <= 7
      ? `closes in ${urgencyDays} day${urgencyDays === 1 ? "" : "s"}`
      : regionHit,
  ].filter(Boolean).join(" · ");
  const subject     = holiday
    ? `${holiday.emoji} Happy ${holiday.name} | ${subjectCore} | Rate Musawo`
    : `${timePeriodLabel()}: ${subjectCore} | Rate Musawo`;

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
          <p style="margin:3px 0 0;font-size:12px;color:#86efac;letter-spacing:0.2px;">Jobs, grants, scholarships, fellowships, conferences, & more for Uganda's health workers</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="background:#ffffff;padding:24px 24px 16px;">
          <p style="margin:0;font-size:17px;color:#111827;">${greeting}, <strong>${name}</strong>.</p>
          <p style="margin:8px 0 0;font-size:15px;color:#6b7280;line-height:1.7;">${message}</p>
          ${holiday ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr><td style="background:#ecfdf5;border-radius:8px;padding:10px 14px;"><p style="margin:0;font-size:14px;color:#065f46;font-weight:600;">${holiday.emoji} Happy ${holiday.name} to everyone celebrating today!</p></td></tr></table>` : ""}
        </td></tr>

        ${urgencyDays !== null && urgencyDays <= 7 ? `
        <!-- Deadline urgency -->
        <tr><td style="background:#fef3c7;padding:9px 24px;border-left:3px solid #f59e0b;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">
            &#x26A1; Closes in ${urgencyDays} day${urgencyDays === 1 ? "" : "s"} -- don't wait too long.
          </p>
        </td></tr>` : ""}

        <!-- Opportunity card -->
        <tr><td style="background:#ffffff;padding:0 24px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">

            ${hasImage ? `<tr><td style="border:1px solid #e5e7eb;border-bottom:none;${imgRadius}padding:0;line-height:0;">
              <img src="${post.image_url}" alt="${post.title}" width="100%"
                style="display:block;width:100%;height:200px;object-fit:cover;object-position:top;${imgRadius}">
            </td></tr>` : ""}

            <tr><td style="border:1px solid #e5e7eb;border-bottom:none;${hasImage ? "" : badgeRadius}background:${color.bg};padding:8px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td><span style="font-size:11px;font-weight:700;color:${color.text};text-transform:uppercase;letter-spacing:0.8px;">${color.label}</span></td>
                ${age ? `<td align="right"><span style="font-size:11px;color:#9ca3af;">${age}</span></td>` : ""}
              </tr></table>
            </td></tr>

            <tr><td style="border:1px solid #e5e7eb;${bodyRadius}padding:20px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 0 4px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#111827;line-height:1.3;">${post.title}</p>
                </td></tr>
                <tr><td style="padding:0 0 14px;">
                  <p style="margin:0;font-size:15px;color:#374151;font-weight:500;">${post.organization}</p>
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

        <!-- Not a fit nudge -->
        <tr><td style="background:#f9fafb;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:14px 24px;">
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
            Not the right fit?&nbsp;
            <a href="${manageLink(sub)}" style="color:#059669;font-weight:600;text-decoration:none;">Update your preferences</a>
            &nbsp;so we only send what matters to you.
          </p>
        </td></tr>

        <!-- Browse more -->
        <tr><td style="background:#ffffff;padding:16px 24px 24px;text-align:center;">
          <p style="margin:0;font-size:14px;color:#9ca3af;">
            Want to see more?&nbsp;
            <a href="${SITE}/jobs" style="color:#0f4c24;font-weight:600;text-decoration:none;">Browse all opportunities</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
            You're receiving this because you subscribed to Rate Musawo opportunity alerts.
          </p>
          <p style="margin:0 0 6px;font-size:12px;">
            <a href="${manageLink(sub)}"
              style="color:#059669;font-weight:600;text-decoration:none;">Manage preferences</a>
            &nbsp;·&nbsp;
            <a href="${manageLink(sub)}"
              style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
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

  return { subject, html, message };
}

// ── Sending helpers ───────────────────────────────────────────────────────
// One retry with backoff on transient SMTP errors — a single hiccup
// shouldn't cost a subscriber their slot for the whole day.
async function sendWithRetry(mail) {
  try {
    return await transporter.sendMail(mail);
  } catch (err) {
    console.warn(`         retrying after: ${err.message}`);
    await new Promise((r) => setTimeout(r, 3_000));
    return transporter.sendMail(mail);
  }
}

// Human-like pacing: randomized delay so bulk sends don't march in
// lock-step (Gmail's rate heuristics favor this as the list grows).
const sendDelay = () => 350 + Math.floor(Math.random() * 450);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Welcome email ──────────────────────────────────────────────────────────
function manageLink(sub) {
  return `${SITE}/newsletter/manage?token=${sub.manage_token}`;
}

function buildWelcomeEmail(sub) {
  const name = sub.first_name ? sub.first_name.trim() : "there";
  const manageUrl = manageLink(sub);
  const intro = pickWelcomeMessage();

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
          <p style="margin:3px 0 0;font-size:12px;color:#86efac;letter-spacing:0.2px;">Jobs, grants, scholarships, fellowships, conferences, & more for Uganda's health workers</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 24px 24px;">
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">You're in, ${name}! 🎉</p>
          <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
            Welcome to Rate Musawo, Uganda's hub for health worker jobs, scholarships, grants, fellowships and conferences.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
            ${intro}
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
            Update what we send you or unsubscribe at any time using the button above.<br>
            Questions? Just reply to this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:16px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
            You subscribed at <a href="${SITE}" style="color:#6b7280;text-decoration:none;">ratemusawo.online</a>
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            <a href="${manageUrl}" style="color:#059669;font-weight:600;text-decoration:none;">Manage preferences</a>
            &nbsp;·&nbsp;
            <a href="${manageUrl}" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
            &nbsp;·&nbsp;
            <a href="mailto:${process.env.GMAIL_USER}" style="color:#6b7280;text-decoration:none;">Contact us</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `Welcome to Rate Musawo, ${name}!`,
    html,
  };
}

async function sendWelcomeEmails() {
  const { data: unwelcomed, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, first_name, manage_token")
    .eq("status", "subscribed")
    .eq("welcome_sent", false);

  if (error) { console.warn("Could not fetch unwelcomed subscribers:", error.message); return; }
  if (!unwelcomed?.length) return;

  const targets = TO_ONLY ? unwelcomed.filter((s) => s.email === TO_ONLY) : unwelcomed;
  if (!targets.length) return;

  console.log(`Sending welcome email to ${targets.length} new subscriber(s)...\n`);

  for (const sub of targets) {
    const { subject, html } = buildWelcomeEmail(sub);

    if (DRY_RUN) {
      console.log(`  [DRY]  WELCOME → ${sub.email}`);
      continue;
    }

    try {
      await sendWithRetry({
        from: `"Rate Musawo" <${process.env.GMAIL_USER}>`,
        to: sub.email,
        subject,
        html,
      });
      console.log(`  WELCOME  ${sub.email}`);
    } catch (err) {
      console.error(`  ERROR    ${sub.email} (welcome): ${err.message}`);
      continue;
    }

    await supabase
      .from("newsletter_subscribers")
      .update({ welcome_sent: true })
      .eq("email", sub.email);

    await pause(sendDelay());
  }

  console.log();
}

// ── Deadline filter ────────────────────────────────────────────────────────
function isExpired(post) {
  if (!post.deadline) return false;           // no deadline = evergreen
  const d = new Date(post.deadline);
  if (isNaN(d.getTime())) return false;       // unparseable = keep it
  const today = new Date();
  today.setHours(0, 0, 0, 0);                // start of today in local time
  return d < today;                           // past = expired
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nRate Musawo Newsletter, ${DRY_RUN ? "DRY RUN" : "LIVE SEND"}`);

  // Gate the real send: only applies to unattended full runs (not --dry,
  // not --to test sends, not --force). Cron fires this every 15 min around
  // each slot; outside a due window, or once today's slot already sent,
  // it's a silent no-op.
  let slot = null;
  if (!DRY_RUN && !TO_ONLY && !FORCE) {
    slot = await dueSlot();
    if (!slot) {
      console.log("No slot due right now. Exiting.");
      return;
    }
    console.log(`Sending for the ${slot.id} slot (${todayEAT()} EAT).`);
  }

  if (RESET) {
    if (!TO_ONLY) {
      console.error("--reset requires --to <email> to avoid wiping all send history.");
      process.exit(1);
    }
    const { error: resetErr } = await supabase
      .from("newsletter_sends")
      .delete()
      .eq("email", TO_ONLY);
    if (resetErr) {
      console.error("Reset failed:", resetErr.message);
      process.exit(1);
    }
    console.log(`Reset send history for ${TO_ONLY}.\n`);
  }

  await sendWelcomeEmails();

  const { data: allPosts, error: postsErr } = await supabase
    .from("posts")
    .select("id,slug,type,title,organization,location,profession,deadline,summary,featured,image_url,published_at")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (postsErr) { console.error("Posts fetch failed:", postsErr.message); process.exit(1); }

  const posts = allPosts.filter((p) => !isExpired(p));
  const expiredCount = allPosts.length - posts.length;
  console.log(`Found ${posts.length} active post(s) (${expiredCount} skipped, deadline passed).`);
  if (!posts.length) { console.log("Nothing to send."); return; }

  const { data: subscribers, error: subErr } = await supabase
    .from("newsletter_subscribers")
    .select("email,first_name,opportunity_types,roles,regions,manage_token")
    .eq("status", "subscribed");

  if (subErr) { console.error("Subscribers fetch failed:", subErr.message); process.exit(1); }

  const targets = TO_ONLY
    ? subscribers.filter((s) => s.email === TO_ONLY)
    : subscribers;

  // Load send history per-subscriber in chunks. Failure is fatal: a partial
  // dedup map would risk repeating listings to real people.
  let sentMap;
  try {
    sentMap = await fetchSentSlugs(subscribers.map((s) => s.email));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log(`${subscribers.length} subscriber(s)${TO_ONLY ? ` → filtered to ${TO_ONLY}` : ""}.\n`);

  let sent = 0, skipped = 0;

  for (const sub of targets) {
    const alreadySent = sentMap[sub.email] ?? new Set();
    const post = pickBestPost(posts, sub, alreadySent);

    if (!post) {
      console.log(`  SKIP   ${sub.email}, no matching post (or all already sent)`);
      skipped++;
      continue;
    }

    const { subject, html, message } = buildEmail(sub, post);

    if (DRY_RUN) {
      console.log(`  [DRY]  ${sub.email}, "${post.title}" (${post.type})`);
      console.log(`         💬 ${message}`);
      sent++;
      continue;
    }

    try {
      await sendWithRetry({
        from: `"Rate Musawo" <${process.env.GMAIL_USER}>`,
        to: sub.email,
        subject,
        html,
      });
      console.log(`  SENT   ${sub.email}`);
      console.log(`         📌 ${post.type.toUpperCase()} | ${post.title}`);
      console.log(`         🏢 ${post.organization}${post.location ? ` · 📍 ${post.location}` : ""}${post.deadline ? ` · ⏰ ${post.deadline}` : ""}`);
      console.log(`         💬 ${message}`);
      sent++;
    } catch (err) {
      console.error(`  ERROR  ${sub.email}: ${err.message}`);
      continue;
    }
    // Record outside the send try/catch, a DB glitch here never marks the send as failed
    await recordSend(sub.email, post.slug);

    await pause(sendDelay());
  }

  console.log(`\nDone. Sent: ${sent}, Skipped: ${skipped}`);

  if (!DRY_RUN && !TO_ONLY && slot) markSlotSent(slot);
}

main();
