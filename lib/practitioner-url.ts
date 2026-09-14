/** Client-safe practitioner URL helpers (no server imports).
 *
 *  Imported by both server components/routes AND client components
 *  (PractitionerCard, ClaimFlow), so this module must never import
 *  Supabase, next/headers or any other server-only code.
 */

/** Slugify for URL segments (names, facets). Mirrors lib/posts slugify. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Canonical name-rich URL for a practitioner: `/practitioners/123-jane-doe`.
 *  The `[id]` route parses the leading numeric prefix, so legacy numeric URLs
 *  (`/practitioners/123`) keep working and canonicalise to this form. Names in
 *  URLs — and therefore in sitemap `<loc>` entries, canonicals and internal
 *  links — are what let "Jane Doe doctor Uganda" style searches surface our
 *  pages instead of a bare numeric URL Google has no text to match on. */
export function practitionerUrl(id: number, name: string): string {
  const slug = slugify(name);
  return slug ? `/practitioners/${id}-${slug}` : `/practitioners/${id}`;
}

/** Parse the `[id]` route param, accepting `123` and `123-jane-doe`. */
export function parsePractitionerIdParam(param: string): number | null {
  const n = Number(String(param).split("-")[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
