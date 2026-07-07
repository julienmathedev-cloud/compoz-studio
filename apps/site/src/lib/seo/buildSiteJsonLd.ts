/**
 * @file apps/site/src/lib/seo/buildSiteJsonLd.ts
 * @layer site/lib/seo
 *
 * @description
 * Public JSON-LD generator for Compoz sites.
 *
 * @remarks
 * - Builds a Schema.org V1 graph from published settings and the current page.
 * - Scope is intentionally limited to WebSite, the main identity entity, WebPage, and BreadcrumbList.
 * - Does not generate per-block schemas, Review, AggregateRating, FAQ, Product, or Article nodes.
 * - Returns `null` when the minimum reliable data is missing.
 */

import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { SiteSettingsDTO } from "@compoz/core/domain/site/dto";
import type {
  SiteIndex,
  StructuredDataEntityType,
} from "@compoz/core/domain/site/entities";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
import { resolveAssetUrl } from "@compoz/ui/lib/seo/metadata-helpers";

type JsonLdNode = Record<string, unknown>;

export type SiteJsonLdGraph = Readonly<{
  "@context": "https://schema.org";
  "@graph": ReadonlyArray<JsonLdNode>;
}>;

type BuildSiteJsonLdInput = Readonly<{
  settings: SiteSettingsDTO;
  page: Page;
  index: SiteIndex;
  pathname: string;
}>;

const SCHEMA_TYPES: Record<StructuredDataEntityType, string> = {
  person: "Person",
  organization: "Organization",
  localBusiness: "LocalBusiness",
  professionalService: "ProfessionalService",
  visualArtist: "VisualArtist",
  autoRepair: "AutoRepair",
};

function trimOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** Removes empty JSON-LD fields so optional structured data does not emit blank schema values. */
function compactRecord(record: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        return false;
      }
      return true;
    }),
  );
}

/** Builds a BreadcrumbList from the published SiteIndex hierarchy when the page has a meaningful trail. */
function buildBreadcrumbs(
  page: Page,
  index: SiteIndex,
  siteUrl: string,
  pageUrl: string,
  breadcrumbId: string,
): JsonLdNode | null {
  const pagesById = new Map(index.pages.map((item) => [item.id, item]));
  const ancestors = [];
  let parentId = page.parentId;
  const visited = new Set<string>();

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = pagesById.get(parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    parentId = parent.parentId;
  }

  const home = index.pages.find((item) => item.slug === "home");
  const items = [
    home
      ? { name: home.name, item: `${siteUrl}/` }
      : { name: "Home", item: `${siteUrl}/` },
    ...ancestors
      .filter((item) => item.slug !== "home")
      .map((item) => ({
        name: item.name,
        item: `${siteUrl}/${encodeURIComponent(item.slug)}`,
      })),
    ...(page.slug === "home" ? [] : [{ name: page.name, item: pageUrl }]),
  ];

  if (items.length < 2) return null;

  return {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: items.map((item, indexPosition) => ({
      "@type": "ListItem",
      position: indexPosition + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

/** Builds the public Schema.org graph only when structured data settings are enabled and reliable. */
export function buildSiteJsonLd({
  settings,
  page,
  index,
  pathname,
}: BuildSiteJsonLdInput): SiteJsonLdGraph | null {
  const config = settings.seo.structuredData;
  if (!config.enabled) return null;

  const configuredBaseUrl =
    trimOptional(settings.seo.baseUrl) ||
    trimOptional(settings.seo.canonicalUrl);
  if (!configuredBaseUrl) return null;

  const metadataBase = resolveSiteBaseUrl(configuredBaseUrl);
  if (!metadataBase) return null;

  const siteUrl = metadataBase.toString().replace(/\/+$/, "");
  const pageUrl = new URL(pathname, `${siteUrl}/`).toString();
  const pageIdBase = pageUrl.replace(/\/+$/, "");
  const websiteId = `${siteUrl}/#website`;
  const identityId = `${siteUrl}/#identity`;
  const webpageId = `${pageIdBase}/#webpage`;
  const breadcrumbId = `${pageIdBase}/#breadcrumb`;

  const name =
    trimOptional(config.name) ||
    trimOptional(settings.identity.siteName) ||
    trimOptional(settings.seo.defaultTitle);
  const description =
    trimOptional(config.description) ||
    trimOptional(settings.seo.defaultDescription) ||
    trimOptional(settings.identity.tagline);
  const pageName =
    trimOptional(page.seoTitle) || trimOptional(page.name) || name;
  const pageDescription = trimOptional(page.seoDescription) || description;
  const logoUrl = resolveAssetUrl(settings.identity.logo?.src, metadataBase);
  const imageUrl = resolveAssetUrl(
    settings.seo.openGraph?.defaultImageUrl,
    metadataBase,
  );
  const sameAs = settings.social.items
    .map((item) => trimOptional(item.href))
    .filter((href): href is string => Boolean(href))
    .filter((href) => {
      try {
        const protocol = new URL(href).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    });
  const address = config.address
    ? compactRecord({
        "@type": "PostalAddress",
        ...config.address,
      })
    : undefined;

  const identity = compactRecord({
    "@type": SCHEMA_TYPES[config.entityType],
    "@id": identityId,
    name,
    description,
    url: siteUrl,
    logo: logoUrl?.toString(),
    image: imageUrl?.toString(),
    email: trimOptional(config.email),
    telephone: trimOptional(config.telephone),
    address: address && Object.keys(address).length > 1 ? address : undefined,
    areaServed: config.areaServed,
    priceRange: trimOptional(config.priceRange),
    openingHours: config.openingHours,
    sameAs,
  });

  if (!identity.name) return null;

  const website = compactRecord({
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name,
    description,
    publisher: { "@id": identityId },
  });
  const webpage = compactRecord({
    "@type": "WebPage",
    "@id": webpageId,
    url: pageUrl,
    name: pageName,
    description: pageDescription,
    isPartOf: { "@id": websiteId },
    about: { "@id": identityId },
  });
  const breadcrumbs = buildBreadcrumbs(
    page,
    index,
    siteUrl,
    pageUrl,
    breadcrumbId,
  );

  if (breadcrumbs) {
    webpage.breadcrumb = { "@id": breadcrumbId };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      website,
      identity,
      webpage,
      ...(breadcrumbs ? [breadcrumbs] : []),
    ],
  };
}

/** Serializes JSON-LD for safe inline script injection by escaping `<`. */
export function serializeSiteJsonLd(value: SiteJsonLdGraph): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
