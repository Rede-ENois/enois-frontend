/**
 * The same app is served on more than one registrable domain (`VITE_SITE_DOMAINS`, primary first:
 * `enois.ia.br,isweee.com`). The session cookies belong to the API host of the site the browser is
 * on, and a call from `isweee.com` to `api.enois.ia.br` is cross-site, so the browser would drop
 * them. A mirror therefore calls its own API host: `https://api.enois.ia.br/api` becomes
 * `https://api.isweee.com/api` when the app runs on `isweee.com`.
 *
 * Anything else (relative dev base, QA hosts, unknown hosts, a single-domain build) keeps the base
 * baked at build time.
 */
export function apiBaseForHost(
  apiBase: string,
  hostname: string,
  siteDomains: readonly string[],
): string {
  const primary = siteDomains[0];
  if (!primary || siteDomains.length < 2) return apiBase;

  let api: URL;
  try {
    api = new URL(apiBase);
  } catch {
    return apiBase;
  }
  if (!belongsTo(api.hostname, primary)) return apiBase;

  const site = siteDomains.find((domain) => belongsTo(hostname.toLowerCase(), domain));
  if (!site || site === primary) return apiBase;

  api.hostname = `${api.hostname.slice(0, -primary.length)}${site}`;
  return api.toString().replace(/\/$/, apiBase.endsWith("/") ? "/" : "");
}

export function parseSiteDomains(value: string | undefined): string[] {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function belongsTo(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}
