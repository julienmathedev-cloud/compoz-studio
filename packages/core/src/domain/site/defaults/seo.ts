/**
 * @file packages/core/src/domain/site/defaults/seo.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour la configuration SEO (`SeoSettings`).
 * Utilisées lors de l’initialisation d’un site ou en absence de configuration persistée.
 *
 * Invariant : configuration déclarative et neutre (aucune logique, aucun choix éditorial forcé).
 */

import { TITLE_PLACEHOLDER } from "@compoz/core/constants/seo/seo";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";

/**
 * Valeurs par défaut pour la configuration SEO
 */
export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  baseUrl: null,
  defaultTitle: "Compoz",
  titleTemplate: TITLE_PLACEHOLDER,
  defaultDescription: null,
  canonicalUrl: null,
  robots: "noindex,nofollow",
  openGraph: null,
  twitter: {
    card: "summary_large_image",
    site: null,
    creator: null,
  },
  structuredDataEnabled: true,
};
