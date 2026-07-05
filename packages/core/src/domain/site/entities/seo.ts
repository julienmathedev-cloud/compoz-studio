/**
 * @file packages/core/src/domain/site/entities/seo.ts
 * @layer core/domain
 * @description
 * Entité métier représentant les réglages SEO globaux du site.
 * Définit la structure canonique des paramètres (meta, OpenGraph, Twitter),
 * sans logique ni valeurs par défaut (voir `defaults/seo.ts`).
 */

import type { TwitterCardType } from "@compoz/core/constants/seo/seo";
import type { AssetUrlOrNull } from "@compoz/core/domain/urls/href";

/** Paramètres OpenGraph pour l’aperçu social. */
export interface OpenGraphSettings {
  /** Titre OG (null si absent). */
  title: string | null;

  /** Description OG (null si absente). */
  description: string | null;

  /** Image OG (null = aucune image). */
  defaultImageUrl: AssetUrlOrNull;

  /** Identifiant média de l'image OG uploadée (optionnel, null-safe legacy). */
  defaultImageMediaAssetId?: string;

  /** Texte alternatif de l’image OG. */
  imageAlt: string;
}

/** Paramètres Twitter Card. */
export interface TwitterSettings {
  /** Type de carte. */
  card: TwitterCardType;

  /** Handle du site (null si absent). */
  site: string | null;

  /** Handle du créateur (null si absent). */
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

/** Réglages SEO globaux. */
export interface SeoSettings {
  /** Domaine de base du site (null si absent). */
  baseUrl: string | null;

  /** Titre par défaut. */
  defaultTitle: string | null;

  /** Template de titre. */
  titleTemplate: string | null;

  /** Description par défaut. */
  defaultDescription: string | null;

  /** URL canonique globale. */
  canonicalUrl: string | null;

  /** Directive robots. */
  robots: string | null;

  /** Bloc OpenGraph. */
  openGraph: OpenGraphSettings | null;

  /** Bloc Twitter. */
  twitter: TwitterSettings | null;

  /** Configuration des données structurées JSON-LD. */
  structuredData: StructuredDataSettings;
}
