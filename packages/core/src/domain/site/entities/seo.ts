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
interface OpenGraphSettings {
  /** Titre OG (absent = undefined, jamais ""). */
  title?: string;

  /** Description OG, optionnelle. */
  description?: string;

  /** Image OG (null = aucune image, sinon AssetUrl valide). */
  defaultImageUrl?: AssetUrlOrNull;

  /** Texte alternatif de l’image OG. */
  imageAlt?: string;
}

/** Paramètres Twitter Card. */
interface TwitterSettings {
  /** Type de carte (toujours défini via les defaults SEO). */
  card: TwitterCardType;

  /** Handles Twitter optionnels (jamais ""). */
  site?: string;
  creator?: string;
}

/** Réglages SEO globaux. */
export interface SeoSettings {
  /** Domaine de base du site (validé par les règles en prod). */
  baseUrl?: string;

  /** Titre par défaut (obligatoire en publication). */
  defaultTitle?: string;

  /** Template de titre (peut contenir le placeholder %s). */
  titleTemplate?: string;

  /** Description par défaut. */
  defaultDescription?: string;

  /** URL canonique globale. */
  canonicalUrl?: string;

  /** Directive robots (ex. "index,follow"). */
  robots?: string;

  /** Bloc OpenGraph facultatif. */
  openGraph?: OpenGraphSettings;

  /** Bloc Twitter (card toujours définie via les defaults). */
  twitter?: TwitterSettings;

  /** Active les données structurées. */
  structuredDataEnabled?: boolean;
}
