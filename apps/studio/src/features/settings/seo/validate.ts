"use client";

/**
 * @file apps/studio/src/features/settings/seo/validate.ts
 * @layer hooks/studio/site/seo
 *
 * @description
 * Validation + warnings UI (front-only) pour le SEO.
 *
 * @remarks
 * - Pas d’erreurs UI bloquantes en V0.5 : la validation principale reste gérée par Zod côté API.
 * - Ce module fournit uniquement des warnings UX non bloquants.
 * - Pattern : warnings calculés sur le modèle **UI** (FormValues RHF).
 */

import { useMemo } from "react";

import { SEO } from "@compoz/core/constants/limits/seo";
import { TITLE_PLACEHOLDER_RE } from "@compoz/core/constants/seo/seo";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

/* ───────────────────────────── 2) Warnings UI (non-bloquants, PURE) ───────────────────────── */

/** Clés stables pour l’i18n des warnings SEO. */
export type SeoWarningKey =
  | "description.length"
  | "titleTemplate.placeholderMissing"
  | "robots.noindex"
  | "openGraph.image.missing";

/**
 * PURE — Calcule les warnings SEO selon les valeurs UI (FormValues RHF).
 *
 * @param i Valeurs `SeoFormValues` issues du formulaire RHF (strings stables).
 * @returns Tableau des warnings à afficher.
 */
export function computeSeoWarnings(i: SeoFormValues): SeoWarningKey[] {
  const out = new Set<SeoWarningKey>();

  /* ----- Description length ----- */
  const desc = (i.defaultDescription ?? "").trim();
  if (
    desc.length > 0 &&
    (desc.length < SEO.DESCRIPTION.MIN || desc.length > SEO.DESCRIPTION.MAX)
  ) {
    out.add("description.length");
  }

  /* ----- Title template placeholder ----- */
  const template = (i.titleTemplate ?? "").trim();
  if (template.length > 0 && !TITLE_PLACEHOLDER_RE.test(template)) {
    out.add("titleTemplate.placeholderMissing");
  }

  /* ----- Robots ----- */
  const robots = (i.robots ?? "").toLowerCase().trim();
  if (robots.includes("noindex")) {
    out.add("robots.noindex");
  }

  /* ----- OpenGraph image ----- */
  const ogImg = (i.openGraph?.defaultImageUrl ?? "").trim();
  if (ogImg.length === 0) {
    out.add("openGraph.image.missing");
  }

  return Array.from(out);
}

/**
 * Hook UI — mémoïse le résultat des warnings SEO.
 *
 * @param values Valeurs RHF (FormValues).
 */
export function useSeoUiWarnings(values: SeoFormValues): SeoWarningKey[] {
  return useMemo(() => computeSeoWarnings(values), [values]);
}

/**
 * Variante “par champs” (optionnelle) si tu veux éviter de passer tout l’objet.
 * Sans cast, car on reconstruit un `SeoFormValues` complet (shape RHF stable).
 */
export function useSeoUiWarningsFromFields(
  defaultDescription: SeoFormValues["defaultDescription"],
  titleTemplate: SeoFormValues["titleTemplate"],
  robots: SeoFormValues["robots"],
  openGraphDefaultImageUrl: SeoFormValues["openGraph"]["defaultImageUrl"],
): SeoWarningKey[] {
  return useMemo(
    () =>
      computeSeoWarnings({
        // Base
        baseUrl: "",
        defaultTitle: "",
        defaultDescription: defaultDescription ?? "",
        titleTemplate: titleTemplate ?? "",
        canonicalUrl: "",
        robots: robots ?? "",
        structuredData: {
          enabled: false,
          entityType: "organization",
          name: "",
          description: "",
          telephone: "",
          email: "",
          address: {
            streetAddress: "",
            postalCode: "",
            addressLocality: "",
            addressRegion: "",
            addressCountry: "",
          },
          areaServed: [],
          priceRange: "",
          openingHours: [],
        },

        // OpenGraph
        openGraph: {
          title: "",
          description: "",
          defaultImageUrl: openGraphDefaultImageUrl ?? "",
          imageAlt: "",
        },

        // Twitter
        twitter: {
          // La card est hors scope warnings ici, mais il faut une valeur stable.
          card: "summary_large_image" as SeoFormValues["twitter"]["card"],
          site: "",
          creator: "",
        },
      }),
    [defaultDescription, titleTemplate, robots, openGraphDefaultImageUrl],
  );
}
