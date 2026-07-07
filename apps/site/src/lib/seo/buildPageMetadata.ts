/**
 * @file apps/site/src/lib/seo/buildPageMetadata.ts
 * @layer site/lib/seo
 *
 * @description
 * Builds SEO metadata for a published public page.
 *
 * @remarks
 * - Used by public routes that define page-level metadata.
 * - Re-injects Open Graph and Twitter metadata so page-level metadata does not accidentally erase values declared by the layout.
 * - Global social SEO fields remain driven by published settings.
 */

import type { Metadata } from "next";

import type { SiteSettingsDTO } from "@compoz/core/domain/site/dto";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
import { resolveAssetUrl } from "@compoz/ui/lib/seo/metadata-helpers";

type BuildPageMetadataParams = Readonly<{
  settings: SiteSettingsDTO | null | undefined;
  title: string | undefined;
  socialTitle?: string;
  description: string | undefined;
  pathname: string;
  brandTitle: string | undefined;
  metadataBase?: URL;
}>;

function trimOptional(value: string | null | undefined): string | undefined {
  return (value ?? "").trim() || undefined;
}

export function buildPageMetadata({
  settings,
  title,
  socialTitle,
  description,
  pathname,
  brandTitle,
  metadataBase: metadataBaseInput,
}: BuildPageMetadataParams): Metadata {
  const metadataBase =
    metadataBaseInput ??
    resolveSiteBaseUrl(settings?.seo?.baseUrl) ??
    undefined;

  const ogTitle =
    trimOptional(settings?.seo?.openGraph?.title) ?? socialTitle ?? title;

  const ogDescription =
    trimOptional(settings?.seo?.openGraph?.description) ?? description;

  const ogImage = resolveAssetUrl(
    settings?.seo?.openGraph?.defaultImageUrl,
    metadataBase,
  );

  const ogImageAlt =
    trimOptional(settings?.seo?.openGraph?.imageAlt) ?? ogTitle;

  return {
    metadataBase,

    title,
    description,

    alternates: {
      canonical: pathname,
    },

    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: pathname,
      type: "website",
      siteName: brandTitle,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: ogImageAlt,
            },
          ]
        : undefined,
    },

    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      site: trimOptional(settings?.seo?.twitter?.site),
      creator: trimOptional(settings?.seo?.twitter?.creator),
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
