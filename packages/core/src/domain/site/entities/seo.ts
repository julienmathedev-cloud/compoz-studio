/**
 * @file packages/core/src/domain/site/entities/seo.ts
 * @layer core/domain/site/entities
 * @description Canonical SEO settings for a site.
 * @remarks
 * This entity only defines persisted SEO shape; metadata generation belongs outside core.
 */

import type { TwitterCardType } from "@compoz/core/constants/seo/seo";
import type { AssetUrlOrNull } from "@compoz/core/domain/urls/href";

export interface OpenGraphSettings {
  title: string | null;
  description: string | null;
  defaultImageUrl: AssetUrlOrNull;
  /** Optional legacy-safe media asset reference for uploaded OpenGraph images. */
  defaultImageMediaAssetId?: string;
  imageAlt: string;
}

export interface TwitterSettings {
  card: TwitterCardType;
  site: string | null;
  creator: string | null;
}

export type StructuredDataEntityType =
  | "person"
  | "organization"
  | "localBusiness"
  | "professionalService"
  | "visualArtist"
  | "autoRepair";

export interface StructuredDataAddress {
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
}

export interface StructuredDataSettings {
  enabled: boolean;
  entityType: StructuredDataEntityType;
  name?: string;
  description?: string;
  telephone?: string;
  email?: string;
  address?: StructuredDataAddress;
  areaServed?: string[];
  priceRange?: string;
  openingHours?: string[];
}

export interface SeoSettings {
  baseUrl: string | null;
  defaultTitle: string | null;
  titleTemplate: string | null;
  defaultDescription: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  openGraph: OpenGraphSettings | null;
  twitter: TwitterSettings | null;
  structuredData: StructuredDataSettings;
}
