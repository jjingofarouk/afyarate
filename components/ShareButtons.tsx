"use client";

import { useState } from "react";
import { SITE_NAME } from "@/lib/site";

const base =
  "inline-flex size-9 items-center justify-center rounded-xl text-white shadow-sm transition hover:scale-105 hover:opacity-90";

export default function ShareButtons({ title, url }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);

  const text = `${title} — ${SITE_NAME}`;
  const q = (s: string) => encodeURIComponent(s);

  async function copyLink() {
    const target = url ?? (typeof window !== "undefined" ? window.location.href : "");
    if (!target) return;

    // Try modern Clipboard API first
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // Fall through to legacy approach
    }

    // Legacy fallback: textarea + execCommand (bypasses NoCopy via window flag)
    try {
      (window as { __allowCopy?: boolean }).__allowCopy = true;
      const el = document.createElement("textarea");
      el.value = target;
      el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      el.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    } finally {
      (window as { __allowCopy?: boolean }).__allowCopy = false;
    }
  }

  const shareUrl = url ?? "";

  const platforms = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${q(`${text} ${shareUrl}`)}`,
      bg: "bg-[#25D366]",
      icon: <WhatsAppIcon />,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${q(shareUrl)}`,
      bg: "bg-[#1877F2]",
      icon: <FacebookIcon />,
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${q(text)}&url=${q(shareUrl)}`,
      bg: "bg-slate-900 dark:bg-slate-100 dark:text-slate-900",
      icon: <XIcon />,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${q(shareUrl)}`,
      bg: "bg-[#0A66C2]",
      icon: <LinkedInIcon />,
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${q(shareUrl)}&text=${q(text)}`,
      bg: "bg-[#229ED9]",
      icon: <TelegramIcon />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Share
      </span>

      {platforms.map((p) => (
        <a
          key={p.name}
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${p.name}`}
          title={`Share on ${p.name}`}
          className={`${base} ${p.bg}`}
        >
          {p.icon}
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        title="Copy link"
        className={`${base} bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600`}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>

      {copied && (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Copied!
        </span>
      )}
    </div>
  );
}

/* ---- Brand / UI icons (24×24) ---- */

function WhatsAppIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
