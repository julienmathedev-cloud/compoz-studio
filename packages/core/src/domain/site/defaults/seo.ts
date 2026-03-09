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
  baseUrl: "", // aucun domaine tant que l'utilisateur ne le définit pas
  defaultTitle: "Compoz", // pas de titre générique par défaut
  titleTemplate: TITLE_PLACEHOLDER, // ex.: "%s" ou "Mon site | %s"
  defaultDescription: "",
  canonicalUrl: "", // défini par l'utilisateur lorsque nécessaire
  robots: "noindex,nofollow", // SEO standard
  openGraph: undefined, // OG non activé par défaut
  twitter: { card: "summary_large_image" }, // choix par défaut courant
  structuredDataEnabled: true, // autorise le rendu minimal RDF/JSON-LD
};
