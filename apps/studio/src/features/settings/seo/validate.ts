"use client";

/**
 * @file apps/studio/src/features/settings/seo/validate.ts
 * @layer studio/features/settings/seo
 *
 * @description
 * Non-blocking studio warning helpers for global SEO settings.
 *
 * @remarks
 * - Domain validation remains handled by Zod and server use cases.
 * - Warnings are computed from the RHF editing shape to support live editor feedback.
 */

import { useMemo } from "react";

import { SEO } from "@compoz/core/constants/limits/seo";
import { TITLE_PLACEHOLDER_RE } from "@compoz/core/constants/seo/seo";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

export type SeoWarningKey =
  | "description.length"
  | "titleTemplate.placeholderMissing"
  | "robots.noindex"
  | "openGraph.image.missing";

/** Computes non-blocking SEO warnings from RHF form values. */
export function computeSeoWarnings(i: SeoFormValues): SeoWarningKey[] {
  const out = new Set<SeoWarningKey>();

  const desc = (i.defaultDescription ?? "").trim();
  if (
    desc.length > 0 &&
    (desc.length < SEO.DESCRIPTION.MIN || desc.length > SEO.DESCRIPTION.MAX)
  ) {
    out.add("description.length");
  }

  const template = (i.titleTemplate ?? "").trim();
  if (template.length > 0 && !TITLE_PLACEHOLDER_RE.test(template)) {
    out.add("titleTemplate.placeholderMissing");
  }

  const robots = (i.robots ?? "").toLowerCase().trim();
  if (robots.includes("noindex")) {
    out.add("robots.noindex");
  }

  const ogImg = (i.openGraph?.defaultImageUrl ?? "").trim();
  if (ogImg.length === 0) {
    out.add("openGraph.image.missing");
  }

  return Array.from(out);
}

export function useSeoUiWarnings(values: SeoFormValues): SeoWarningKey[] {
  return useMemo(() => computeSeoWarnings(values), [values]);
}

/**
 * Computes SEO warnings from isolated fields by rebuilding the stable RHF shape.
 *
 * @remarks
 * - Useful when a caller watches only the fields that affect these warnings.
 * - Non-warning fields still receive safe defaults because `computeSeoWarnings` expects a complete `SeoFormValues` object.
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

        openGraph: {
          title: "",
          description: "",
          defaultImageUrl: openGraphDefaultImageUrl ?? "",
          imageAlt: "",
        },

        twitter: {
          // Card is outside this warning scope but required for a complete RHF shape.
          card: "summary_large_image" as SeoFormValues["twitter"]["card"],
          site: "",
          creator: "",
        },
      }),
    [defaultDescription, titleTemplate, robots, openGraphDefaultImageUrl],
  );
}
