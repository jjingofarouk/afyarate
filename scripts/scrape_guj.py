#!/usr/bin/env python3
"""
Scrape health & medicine job listings from Great Uganda Jobs into the shape the
posts uploader (scripts/upload_posts.mjs) expects.

Source: https://www.greatugandajobs.com/job-categories/newest-jobs/category-health-medicine-jobs-in-uganda-26

The category holds ~7,000 listings (newest-first). Each listing card already
carries title, organisation, job type, salary, category, posted date, deadline
and duty station; the detail page adds the full description, qualification,
experience and application procedure.

Strategy:
  1. --collect   walk every listing page (initial + AJAX `job.getnextjobs`)
                 and save the cheap card data to data/guj_listings.jsonl.
  2. --details   fetch the detail page for every *open* job (deadline in the
                 future, or none) and write full posts to data/guj_jobs.jsonl.
                 Use --all to fetch details for every listing regardless of
                 deadline.

Polite: small worker pool, small stagger delay, retries with backoff, and a
checkpoint so a Ctrl-C can be resumed by re-running the same command.

Usage:
    python3 scripts/scrape_guj.py --collect
    python3 scripts/scrape_guj.py --details            # open jobs only
    python3 scripts/scrape_guj.py --details --all      # every listing
    python3 scripts/scrape_guj.py --collect --max-pages 5
    python3 scripts/scrape_guj.py --details --workers 10
"""
import argparse
import json
import os
import re
import sys
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from urllib.parse import urljoin

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CATEGORY = "health-medicine-jobs-in-uganda-26"
BASE = "https://www.greatugandajobs.com"
LISTING_URL = f"{BASE}/job-categories/newest-jobs/category-{CATEGORY}"
AJAX_URL = f"{BASE}/index.php?option=com_jsjobs&task=job.getnextjobs&pagenum={{}}"
DETAIL_URL = f"{BASE}/component/jsjobs/job-detail/{{path}}"

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
LISTINGS_FILE = os.path.join(DATA_DIR, "guj_listings.jsonl")
OUT_FILE = os.path.join(DATA_DIR, "guj_jobs.jsonl")
CHECKPOINT_FILE = os.path.join(DATA_DIR, "guj_scrape_checkpoint.json")

DELAY = float(os.environ.get("SCRAPE_DELAY", "0.2"))
TIMEOUT = 45
MAX_RETRIES = 5
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------
def fetch(url, data=None):
    """GET (or POST when data given) and return the decoded body."""
    # Some job URLs contain literal non-ASCII chars (e.g. an en dash), encode them.
    url = urllib.parse.quote(url, safe="/:?=&%-._~#+")
    req = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(data).encode() if data else None,
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read().decode("utf-8", "replace")


def fetch_retry(url, data=None, retries=MAX_RETRIES):
    last = None
    for attempt in range(retries):
        try:
            return fetch(url, data)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 ** attempt + 0.5)
    raise last


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------
def clean(text):
    return re.sub(r"\s+", " ", (text or "")).strip()


def norm_label(text):
    """Normalise a field label (strip &nbsp;, trailing colons/whitespace)."""
    t = clean(text)
    t = t.replace("&nbsp;", " ").replace("&nbsp", " ")
    t = re.sub(r"[:\uFF1A\s]+$", "", t).strip()
    return t


def parse_date(s):
    s = clean(s)
    if not s:
        return None
    # "Monday, August 10 2026" / "Thursday, August 13 2026"
    m = re.search(r"([A-Za-z]{3,9})\s+(\d{1,2})\s+(\d{4})", s)
    if m:
        mon = MONTHS.get(m.group(1).lower()[:3])
        if mon:
            try:
                return date(int(m.group(3)), mon, int(m.group(2))).isoformat()
            except ValueError:
                pass
    # "11 March 2025" (day month year, no weekday)
    m = re.search(r"(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})", s)
    if m:
        mon = MONTHS.get(m.group(2).lower()[:3])
        if mon:
            try:
                return date(int(m.group(3)), mon, int(m.group(1))).isoformat()
            except ValueError:
                pass
    # "30-07-2026" or "30/07/2026" (d-m-y)
    m = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", s)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return date(y, mo, d).isoformat()
        except ValueError:
            pass
    return None


def posted_ago_date(posted_text):
    """Approximate absolute date from relative 'N Days/Weeks/Months Ago' text."""
    t = (posted_text or "").lower()
    today = date.today()
    m = re.search(r"(\d+)\s+day", t)
    if m:
        return today - timedelta(days=int(m.group(1)))
    m = re.search(r"(\d+)\s+week", t)
    if m:
        return today - timedelta(weeks=int(m.group(1)))
    m = re.search(r"(\d+)\s+month", t)
    if m:
        return today - timedelta(days=30 * int(m.group(1)))
    m = re.search(r"(\d+)\s+year", t)
    if m:
        return today - timedelta(days=365 * int(m.group(1)))
    if "yesterday" in t:
        return today - timedelta(days=1)
    if "today" in t:
        return today
    return None


def div_content(html, class_name):
    """Return the balanced inner HTML of the first <div class="..."> match."""
    pat = re.compile(r'<div[^>]*class="[^"]*%s[^"]*"[^>]*>' % re.escape(class_name), re.I)
    m = pat.search(html)
    if not m:
        return None
    start = m.end()
    depth = 1
    pos = start
    while pos < len(html):
        o = html.find("<div", pos)
        c = html.find("</div>", pos)
        if o == -1 and c == -1:
            break
        if c == -1 or (o != -1 and o < c):
            depth += 1
            pos = o + 4
        else:
            depth -= 1
            pos = c + 6
            if depth == 0:
                return html[start:pos]
    return None


def extract_text(html):
    return clean(re.sub(r"<[^>]+>", " ", html))


def clean_description(desc):
    """Strip the leading metadata blob and the trailing application section."""
    if not desc:
        return ""
    # Metadata prefix always ends at "<deadline ISO> <positions> ", cut there.
    m = re.search(r"\d{4}-\d{2}-\d{2}T[^ ]+\s+\d+\s", desc)
    if m:
        desc = desc[m.end():]
    else:
        # Fallback: the real body starts at one of these section headings.
        markers = [
            "Job Summary", "Job Description", "Job Details", "Job Overview",
            "Main Purpose", "Role Summary", "About the Role", "About the Job",
            "Overall Purpose", "Position Summary", "Key Responsibilities",
            "Duties and Responsibilities", "Summary", "Description",
        ]
        best = None
        for mk in markers:
            i = desc.find(mk)
            if i != -1 and (best is None or i < best):
                best = i
        if best is not None:
            desc = desc[best:]
            m = re.match(
                r"^(?:Job Summary|Job Description|Job Details|Job Overview|Main Purpose|"
                r"Role Summary|About the Role|About the Job|Overall Purpose|Position Summary|"
                r"Key Responsibilities|Duties and Responsibilities|Summary|Description)[\s:\-]*",
                desc,
                re.I,
            )
            if m:
                desc = desc[m.end():]
    # The application procedure is captured separately; trim it from the body.
    m = re.search(r"\bJob application procedure\b", desc, re.I)
    if m:
        desc = desc[:m.start()].strip()
    return desc


# ---------------------------------------------------------------------------
# Listing card -> dict
# ---------------------------------------------------------------------------
def parse_card(card_html, url):
    out = {"url": url}
    m = re.search(r'<a class="jobtitle" href="([^"]+)"[^>]*>(.*?)</a>', card_html, re.S)
    if not m:
        return None
    out["title"] = clean(m.group(2))
    out["href"] = m.group(1)

    # Organisation from the company logo, else from the title "... job at X"
    m = re.search(r'<img[^>]*title="([^"]+)"', card_html)
    if m:
        out["organization"] = clean(m.group(1))
    else:
        m = re.search(r"\b(?:job|position|career)\s+(?:opportunity\s+)?(?:in\s+Uganda\s+)?(?:at|-)\s+(.+)$", out["title"], re.I)
        out["organization"] = clean(m.group(1)) if m else None

    m = re.search(r'<span class="js-status js-type">([^<]*)</span>', card_html)
    out["employmentType"] = clean(m.group(1)) if m else None
    m = re.search(r'class="js-col-xs-12 js-col-md-6 js-jobsalary js-jobtype-tablet">([^<]*)</span>', card_html)
    out["salary"] = clean(m.group(1)) if m else None

    # js-bold label/value pairs (Job Category, Posted, Deadline, Duty Station)
    fields = {}
    for m in re.finditer(
        r'<span class="js-bold">([^<]*?)</span>\s*(.*?)(?=<span class="js-bold">|</div>|$)', card_html, re.S
    ):
        lab = norm_label(m.group(1))
        val = extract_text(m.group(2))
        if lab and val:
            fields[lab] = val
    out["category"] = fields.get("Job Category")
    out["postedText"] = fields.get("Posted")
    out["deadlineText"] = fields.get("Deadline of this Job")
    out["location"] = fields.get("Duty Station")
    out["deadline"] = parse_date(fields.get("Deadline of this Job"))
    return out


# ---------------------------------------------------------------------------
# Detail page -> post dict
# ---------------------------------------------------------------------------
PROFESSION_RULES = [
    (r"\bnurse\b|\bnursing\b|\bmidwife\b|\bmidwifery\b", "Nurse / Midwife"),
    (r"\bclinical officer\b", "Clinical Officer"),
    (r"\bdoctor\b|\bphysician\b|\bmedical officer\b|\bpediatrician\b|\bpaediatrician\b|\bgynaecolog|\bgynecolog|\bsurgeon\b|\bobstetrician\b|\bana?esthesiolog|\bradiolog|\bdermatolog|\bcardiolog|\boncolog|\bpsychiatrist\b", "Doctor"),
    (r"\bpharmacist\b|\bpharmacy\b|\bpharmaco\b|\bdrug\b", "Pharmacist"),
    (r"\blaboratory\b|\blab technolog|\blab technic|\bmedical laboratory|\bphlebotom", "Laboratory"),
    (r"\bradiographer\b|\bradiograph\b|\bimaging\b|\bsonographer\b|\bultrasound\b", "Radiography / Imaging"),
    (r"\bphysiotherapist\b|\bphysiotherapy\b|\boccupational therapist\b|\borthoped|\borthopae", "Physiotherapy / Occupational"),
    (r"\bdentist\b|\bdental\b|\borthodontist\b", "Dentist"),
    (r"\bcounselor\b|\bcounsellor\b|\bpsycholog\b|\bmental health\b|\bsocial worker\b", "Mental Health / Counseling"),
    (r"\benvironmental health\b|\bsanitation\b|\bpublic health\b", "Environmental / Public Health"),
    (r"\bnutritionist\b|\bdietician\b|\bnutrition\b|\bdietetics\b", "Nutrition / Dietetics"),
]


def classify_profession(title):
    t = (title or "").lower()
    for pat, prof in PROFESSION_RULES:
        if re.search(pat, t):
            return prof
    return None


def parse_detail(html, listing):
    d = dict(listing)

    m = re.search(r'jsjobs-main-page-title">\s*(.*?)\s*<', html, re.S)
    if m:
        d["title"] = clean(m.group(1))

    # structured label/value pairs
    fields = {}
    for m in re.finditer(
        r'js_job_data_wrapper[^>]*>\s*<span[^>]*js_job_data_title[^>]*>(.*?)</span>\s*<span[^>]*js_job_data_value[^>]*>(.*?)</span>',
        html,
        re.S,
    ):
        t = norm_label(m.group(1))
        v = extract_text(m.group(2))
        if t and v:
            fields.setdefault(t, v)
    d["category"] = fields.get("Job Category", d.get("category"))
    d["employmentType"] = fields.get("Job Type", d.get("employmentType"))
    d["location"] = fields.get("Duty Station", d.get("location"))
    d["salary"] = fields.get("Salary", d.get("salary"))
    d["posted"] = parse_date(fields.get("Posted") or fields.get("Start Publishing")) or d.get("posted")
    dl = parse_date(fields.get("Deadline of this Job"))
    if dl:
        d["deadline"] = dl

    # description: prefer og:description (clean single body), else the body div
    ogm = re.search(r'<meta property="og:description" content="(.*?)"', html, re.S)
    if ogm:
        raw_desc = extract_text(ogm.group(1))
    else:
        no_style = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.S)
        desc_div = div_content(no_style, "jsjobs_description_data")
        raw_desc = extract_text(desc_div) if desc_div else ""

    # Capture the application procedure before the body is trimmed.
    m = re.search(r"Job application procedure\s*(.*?)(?:All Jobs|QUICK ALERT|$)", raw_desc, re.I | re.S)
    if m:
        d["howToApply"] = clean(m.group(1))

    desc = clean_description(raw_desc)
    d["description"] = desc

    # experience / education live inside the description
    m = re.search(r"Experience in Months:\s*(\d+)", desc, re.I)
    if m:
        d["experienceLevel"] = f"{m.group(1)} months"
    m = re.search(r"Level of Education:\s*(.*?)(?:Job application procedure|Work Hours|Experience in Months|$)", desc, re.I)
    if m:
        d["qualification"] = clean(m.group(1)).rstrip(". ").strip()

    return d


def to_post(job):
    """Map a scraped job dict onto the posts uploader's expected shape."""
    title = job.get("title") or ""
    org = job.get("organization")
    profession = classify_profession(title)
    description = job.get("description") or ""
    summary = description[:220] or None
    how = job.get("howToApply") or None
    if not how and description:
        # fall back to the last sentence of the description mentioning applying
        m = re.search(r"([^.]*[Aa]ppl(y|ication)[^.]*\.)", description)
        if m:
            how = m.group(1).strip()
    location = job.get("location")
    if location:
        # "Kalisizo, Kyotera District | Kyotera" -> keep the main part
        location = location.split("|")[0].strip()
    post = {
        "type": "job",
        "title": title,
        "organization": org,
        "category": "Health & Medicine",
        "profession": profession,
        "location": location or None,
        "country": "Uganda",
        "employmentType": job.get("employmentType") or None,
        "experienceLevel": job.get("experienceLevel") or None,
        "qualification": job.get("qualification") or None,
        "salary": job.get("salary") or None,
        "description": description or title,
        "summary": summary,
        "howToApply": how,
        "applicationUrl": job.get("url"),
        "deadline": job.get("deadline"),
        "publishedAt": job.get("posted"),
        "sourceName": "Great Uganda Jobs",
        "sourceUrl": job.get("url"),
        "tags": ["health", "medicine"],
        "featured": False,
        "status": "published",
    }
    if profession:
        post["tags"].append(profession)
    return post


# ---------------------------------------------------------------------------
# Phases
# ---------------------------------------------------------------------------
def collect_listings(args):
    """Walk every listing page and append parsed cards to guj_listings.jsonl."""
    os.makedirs(DATA_DIR, exist_ok=True)
    ck = {}
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE) as f:
            ck = json.load(f)
    next_page = ck.get("listings_next_page", 0)
    seen = set(ck.get("listings_seen", []))

    collected = 0
    lock = threading.Lock()

    def write_cards(cards):
        with lock:
            with open(LISTINGS_FILE, "a") as f:
                for c in cards:
                    f.write(json.dumps(c) + "\n")

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        page = next_page
        while True:
            if args.max_pages and page >= args.max_pages:
                break
            if page == 0:
                body = fetch_retry(LISTING_URL)
            else:
                body = fetch_retry(AJAX_URL.format(page),
                                   {"jt": "", "cat": CATEGORY, "cd": ""})
            cards = []
            new_in_page = 0
            for block in re.split(r'<div class="js-toprow">', body)[1:]:
                href = re.search(r'<a class="jobtitle" href="([^"]+)"', block)
                if not href:
                    continue
                url = urljoin(BASE, href.group(1).split("?")[0]) if href.group(1).startswith("/") else href.group(1)
                if url in seen:
                    continue
                card = parse_card(block, url)
                if not card:
                    continue
                seen.add(url)
                cards.append(card)
                new_in_page += 1
            if cards:
                write_cards(cards)
            collected += new_in_page
            print(f"  page {page}: +{new_in_page} (total {collected})", flush=True)
            # checkpoint progress
            with lock:
                with open(CHECKPOINT_FILE, "w") as f:
                    json.dump({"listings_next_page": page + 1,
                               "listings_seen": sorted(seen)[-5000:]}, f)
            if new_in_page < 20:
                break  # last page
            page += 1

    print(f"Listings collected: {collected} (checkpointed)")


def load_listings():
    listings = []
    if os.path.exists(LISTINGS_FILE):
        with open(LISTINGS_FILE) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        listings.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    return listings


def fetch_details(args):
    os.makedirs(DATA_DIR, exist_ok=True)
    listings = load_listings()
    if not listings:
        print("No listings found. Run --collect first.")
        sys.exit(1)

    today = date.today().isoformat()
    if args.all:
        todo = listings
    else:
        todo = [
            l for l in listings
            if (l.get("deadline") and l["deadline"] >= today)
            or (not l.get("deadline")
                and posted_ago_date(l.get("postedText")) is not None
                and posted_ago_date(l.get("postedText")) >= date.today() - timedelta(days=90))
        ]
    print(f"{len(listings)} listings, {len(todo)} to fetch (open jobs)", flush=True)

    ck = {}
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE) as f:
            ck = json.load(f)
    done = set(ck.get("details_done", []))
    todo = [l for l in todo if l.get("url") not in done]

    lock = threading.Lock()
    errors = []

    def fetch_one(job):
        detail_url = urljoin(BASE, job["url"])
        try:
            html = fetch_retry(detail_url)
            parsed = parse_detail(html, job)
            post = to_post(parsed)
            with lock:
                with open(OUT_FILE, "a") as f:
                    f.write(json.dumps(post) + "\n")
                done.add(job["url"])
                with open(CHECKPOINT_FILE, "w") as f:
                    json.dump({"details_done": sorted(done)[-8000:]}, f)
            return job["url"]
        except Exception as e:  # noqa: BLE001
            errors.append((job["url"], str(e)))
            time.sleep(0.5)
            return None

    completed = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(fetch_one, j): j for j in todo}
        for fut in as_completed(futures):
            if fut.result():
                completed += 1
            if completed % 25 == 0:
                print(f"  details: {completed}/{len(todo)}", flush=True)
            time.sleep(DELAY)

    print(f"Done: {completed} job details written to {OUT_FILE}")
    if errors:
        print(f"{len(errors)} failures (e.g. {errors[0]})")


def main():
    ap = argparse.ArgumentParser(description="Scrape Great Uganda Jobs health/medicine listings")
    ap.add_argument("--collect", action="store_true", help="collect listing cards")
    ap.add_argument("--details", action="store_true", help="fetch detail pages for open jobs")
    ap.add_argument("--all", action="store_true", help="fetch details for every listing (incl. expired)")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--max-pages", type=int, default=0, help="cap listing pages (testing)")
    args = ap.parse_args()

    if args.collect:
        collect_listings(args)
    if args.details:
        fetch_details(args)
    if not args.collect and not args.details:
        ap.print_help()


if __name__ == "__main__":
    main()
