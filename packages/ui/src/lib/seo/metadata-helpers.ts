/**
 * @file packages/ui/src/lib/seo/metadata-helpers.ts
 * @layer ui/lib/seo
 *
 * @description
 * Helpers SEO/Metadata (Next.js) : résolution d'URLs et normalisation de templates.
 *
 * @remarks
 * - Helpers "best-effort" (défensifs) : aucune validation sécurité forte ici.
 * - Réutilisables dans `generateMetadata`, `robots.ts`, `sitemap.ts`, etc.
 */

function safeUrl(input: string | null | undefined): URL | undefined {
  const s = (input ?? "").trim();
  if (!s) return undefined;

  try {
    return new URL(s);
  } catch {
    return undefined;
  }
}

/**
 * Résout une URL d’asset (favicon / og:image) :
 * - si absolute : retourne telle quelle
 * - sinon, si `metadataBase` fourni : construit une URL relative au base
 * - sinon : retourne la string (path relatif) telle quelle
 */
export function resolveAssetUrl(
  raw: string | null | undefined,
  metadataBase?: URL,
): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const abs = safeUrl(s);
  if (abs) return abs.toString();

  if (metadataBase) {
    try {
      return new URL(s, metadataBase).toString();
    } catch {
      return s;
    }
  }

  return s;
}

/**
 * Assure un template de title valide :
 * - si vide → "%s — <siteTitle>"
 * - si contient déjà "%s" → inchangé
 * - sinon → "%s — <siteTitle>"
 */
export function ensureTitleTemplate(
  template: string,
  siteTitle: string,
): string {
  const t = template.trim();
  if (!t) return `%s — ${siteTitle}`;
  if (t.includes("%s")) return t;
  return `%s — ${siteTitle}`;
}

/**
 * Résout un href d’icône (favicon) :
 * - absolute http(s) → ok
 * - "//domain/..." → force https:
 * - "/path" → ok
 * - "domain.tld/..." → préfixe https:// (heuristique)
 * - sinon : retourne tel quel
 */
export function resolveIconHref(
  raw: string | null | undefined,
): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const abs = safeUrl(s);
  if (abs) return abs.toString();

  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return `https://${s}`;

  return s;
}

/** Expose `safeUrl` uniquement si tu en as besoin ailleurs. */
export function toSafeUrl(input: string | null | undefined): URL | undefined {
  return safeUrl(input);
}
