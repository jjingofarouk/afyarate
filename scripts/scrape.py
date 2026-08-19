#!/usr/bin/env python3
"""
Scrape ALL licensed health practitioners from the Uganda eHealth License portal.

Source: https://www.ehealthlicense.go.ug/index.php/search/cadre
- The unfiltered query returns every record across all councils
  (Uganda Nurses & Midwives, Allied Health Professionals, Uganda Medical & Dental
  Practitioners) sorted by council, 20 records per page.
- Pagination via `?page=N`. ~121,089 records => ~6,055 pages.

Output:       data/health_workers.jsonl  (one JSON object per line)
Checkpoint:   data/scrape_checkpoint.json (resumable; safe to Ctrl-C and rerun)

Each record captures: id (data-key), name, registration status, council,
registration no/date, licence number/expiry/status, qualifications and, when the
portal publishes one, the practitioner's photo URL (image_url).

The script is polite: it uses a small pool of concurrent workers (default 4)
because the portal is slow to respond, waits briefly between requests, and
retries failed pages with exponential backoff. It only uses the public,
unauthenticated search endpoint.

Memory is bounded: only a handful of pages are in flight at a time and each
completed future is dropped as soon as it is written, so RSS stays flat at a
few MB regardless of how many pages have been scraped (it never accumulates
all 121k records in RAM, they stream to disk).

Usage:
    python3 scripts/scrape.py                     # full run (resumes)
    python3 scripts/scrape.py --workers 10        # more/fewer concurrent workers
    python3 scripts/scrape.py --max-pages 3       # quick test
    python3 scripts/scrape.py --images-only       # backfill missing images
"""
import argparse
import json
import math
import os
import re
import sys
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://www.ehealthlicense.go.ug/index.php/search/cadre"
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
OUT_FILE = os.path.join(DATA_DIR, "health_workers.jsonl")
CHECKPOINT_FILE = os.path.join(DATA_DIR, "scrape_checkpoint.json")

PAGE_SIZE = 20
DELAY = float(os.environ.get("SCRAPE_DELAY", "0.25"))  # stagger between completions
TIMEOUT = 90
MAX_RETRIES = 6
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# --- regexes ---------------------------------------------------------------
SHOWING_RE = re.compile(r"Showing <b>([\d,-]+)</b> of <b>([\d,]+)</b> items")
NAME_RE = re.compile(r"<h5><b>Name: </b>(.*?)</h5>", re.S)
REG_STATUS_RE = re.compile(
    r"<h5><b>Registration Status: </b><span[^>]*>\s*(.*?)\s*</span>", re.S
)
COUNCIL_RE = re.compile(r"<h5><b>Council: </b>(.*?)</h5>", re.S)
REG_NO_RE = re.compile(r"<h5><b>Registration No: </b>(.*?)</h5>", re.S)
REG_DATE_RE = re.compile(r"<h5><b>Registration Date: </b>(.*?)</h5>", re.S)
LIC_NO_RE = re.compile(r"<h5><b>License Number:</b>\s*(.*?)</h5>", re.S)
LIC_EXP_RE = re.compile(r"<h5><b>License Expiry Date:</b>\s*(.*?)</h5>", re.S)
LIC_STATUS_RE = re.compile(
    r"<h5><b>Licence Status: </b>\s*<span[^>]*>\s*(.*?)\s*</span>", re.S
)
QUAL_RE = re.compile(r"<b>Qualifications: </b>(.*?)</h5>", re.S)
IMAGE_RE = re.compile(r"<img[^>]*src=\"(/images/[^\"]+)\"")


def clean(text):
    return re.sub(r"\s+", " ", (text or "")).strip()


def fetch_page(page):
    url = f"{BASE}?page={page}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_err = None
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.read().decode("utf-8", "ignore")
        except Exception as err:  # noqa: BLE001 - retry any network error
            last_err = err
            wait = min(2 ** attempt, 60)
            print(f"    page {page}: {err}, retry in {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"page {page} failed after retries: {last_err}")


def parse_page(html, page):
    """Parse all record cards from a page. Each card starts with <div data-key="N">."""
    records = []
    blocks = re.split(r'<div data-key="(\d+)">', html)
    # blocks[0] = preamble; then (key, body) pairs
    for i in range(1, len(blocks) - 1, 2):
        key = blocks[i]
        body = blocks[i + 1]

        def field(pat):
            m = pat.search(body)
            return clean(m.group(1)) if m else None

        image = IMAGE_RE.search(body)
        records.append(
            {
                "id": int(key),
                "name": field(NAME_RE),
                "registration_status": field(REG_STATUS_RE),
                "council": field(COUNCIL_RE),
                "registration_no": field(REG_NO_RE),
                "registration_date": field(REG_DATE_RE),
                "license_number": field(LIC_NO_RE),
                "license_expiry_date": field(LIC_EXP_RE),
                "licence_status": field(LIC_STATUS_RE),
                "qualifications": field(QUAL_RE),
                "image_url": ("https://www.ehealthlicense.go.ug" + image.group(1))
                if image
                else None,
                "source_url": f"{BASE}?page={page}",
            }
        )
    return records


def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            return {}
    return {}


def save_checkpoint(state):
    tmp = CHECKPOINT_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(state, fh)
    os.replace(tmp, CHECKPOINT_FILE)


def backfill_images(out_file):
    """Re-fetch pages for records missing image_url and rebuild the JSONL.

    The site only renders a photo on cards that have one, so a full-page fetch
    gives us every image for that page. Safety net in case a run was started
    before image parsing was added.
    """
    print("Backfilling images from existing JSONL ...")
    if not os.path.exists(out_file):
        print("No JSONL found; nothing to backfill.")
        return
    pages_missing = {}
    records = []
    with open(out_file, encoding="utf-8") as fh:
        for line in fh:
            rec = json.loads(line)
            records.append(rec)
            if not rec.get("image_url"):
                m = re.search(r"page=(\d+)", rec.get("source_url", ""))
                pages_missing.setdefault(int(m.group(1)) if m else 1, []).append(rec["id"])

    print(f"{len(pages_missing)} pages have records missing images")
    for page in sorted(pages_missing):
        html = fetch_page(page)
        found = {int(k): v for k, v in parse_page(html, page)}
        for rid in pages_missing[page]:
            rec = found.get(rid)
            if not rec or not rec.get("image_url"):
                continue
            for stored in records:
                if stored["id"] == rid:
                    stored["image_url"] = rec["image_url"]
                    break
        time.sleep(0.25)

    tmp = out_file + ".bak"
    with open(tmp, "w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    os.replace(tmp, out_file)
    print(f"Backfill done. Rebuilt images for records on {len(pages_missing)} pages.")


def count_lines(path):
    if not os.path.exists(path):
        return 0
    with open(path, "rb") as fh:
        return sum(1 for _ in fh)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-pages", type=int, default=None,
                    help="stop after this many NEW pages (for testing)")
    ap.add_argument("--start-page", type=int, default=None,
                    help="override checkpoint and start here")
    ap.add_argument("--workers", type=int, default=6,
                    help="concurrent page fetches (default 6)")
    ap.add_argument("--images-only", action="store_true",
                    help="re-read existing JSONL and backfill records missing image_url")
    args = ap.parse_args()

    os.makedirs(DATA_DIR, exist_ok=True)

    if args.images_only:
        return backfill_images(OUT_FILE)

    state = load_checkpoint()
    completed = set(state.get("completed_pages", []))
    total = state.get("total")

    # Support old checkpoints that only tracked last_page.
    if state.get("last_page") and not completed:
        completed = set(range(1, int(state["last_page"]) + 1))

    if args.start_page is not None:
        completed = set(range(1, args.start_page))  # redo from start_page onward

    # Discover the grand total if we don't have it yet.
    if not total:
        first = fetch_page(1)
        m = SHOWING_RE.search(first)
        if not m:
            print("Could not determine total; page 1 had no result counts.", file=sys.stderr)
            sys.exit(1)
        total = int(m.group(2).replace(",", ""))
        if 1 not in completed:
            recs = parse_page(first, 1)
            with open(OUT_FILE, "a", encoding="utf-8") as fh:
                fh.write("\n".join(json.dumps(r, ensure_ascii=False) for r in recs) + "\n")
            completed.add(1)
            save_checkpoint({"total": total, "completed_pages": sorted(completed),
                             "written": count_lines(OUT_FILE)})
            time.sleep(DELAY)

    last_page = math.ceil(total / PAGE_SIZE)
    print(f"Total records: {total}  ->  {last_page} pages of {PAGE_SIZE}")

    pending = [p for p in range(1, last_page + 1) if p not in completed]
    if not pending:
        print("Already complete. Nothing to do.")
        return

    if args.max_pages is not None:
        pending = pending[: args.max_pages]
    print(f"{len(pending)} pages remaining (skipping {len(completed)} done)")

    lock = threading.Lock()
    out = open(OUT_FILE, "a", encoding="utf-8")
    written = count_lines(OUT_FILE)
    done = len(completed)
    t0 = time.time()
    failed = []

    def handle(page, recs):
        nonlocal written, done
        payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in recs) + "\n"
        with lock:
            out.write(payload)
            out.flush()
            written += len(recs)
            completed.add(page)
            done += 1
            if done % 25 == 0:
                save_checkpoint({"total": total, "completed_pages": sorted(completed),
                                 "written": written, "failed_pages": sorted(failed)})

    def process(page):
        html = fetch_page(page)
        return page, parse_page(html, page)

    try:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            # Bounded in-flight window: only a handful of futures exist at a
            # time, so memory stays flat (a few MB) no matter how far along we
            # are, instead of accumulating thousands of completed results.
            it = iter(pending)
            inflight = {}
            for _ in range(min(args.workers * 2, len(pending))):
                try:
                    p = next(it)
                except StopIteration:
                    break
                inflight[ex.submit(process, p)] = p

            while inflight:
                done_fut = next(as_completed(inflight))
                page = inflight.pop(done_fut)  # drop the future -> frees its result
                try:
                    _, recs = done_fut.result()
                except Exception as err:  # noqa: BLE001 - keep going on bad pages
                    failed.append(page)
                    print(f"  ! page {page} failed after retries: {err}", file=sys.stderr)
                else:
                    handle(page, recs)

                try:
                    nxt = next(it)
                except StopIteration:
                    pass
                else:
                    inflight[ex.submit(process, nxt)] = nxt

                elapsed = time.time() - t0
                rate = done / elapsed if elapsed else 0
                remaining = last_page - done
                eta_min = (remaining / rate / 60) if rate else 0
                if done % 50 == 0 or done == last_page:
                    print(
                        f"  pages done {done}/{last_page}  records={written}/{total}  "
                        f"({rate:.2f} pgs/s, ~{eta_min:.0f} min left)",
                        file=sys.stderr,
                    )
                time.sleep(DELAY)
    finally:
        save_checkpoint({"total": total, "completed_pages": sorted(completed),
                         "written": written, "failed_pages": sorted(failed)})
        out.close()

    print(f"Done. Wrote {written} records to {OUT_FILE}")
    if failed:
        print(f"WARNING: {len(failed)} page(s) could not be fetched: "
              f"{', '.join(map(str, sorted(failed)))}", file=sys.stderr)


if __name__ == "__main__":
    main()
