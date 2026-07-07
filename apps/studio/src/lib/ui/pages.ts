/**
 * @file apps/studio/src/lib/ui/pages.ts
 * @layer studio/lib/ui
 *
 * @description
 * UI helpers for formatting page paths.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

/** Formats a page slug as the public path shown in the Studio UI. */
export function formatPagePath(slug: string): string {
  const s = String(slug ?? "").trim();

  if (!s || s === HOME_SLUG || s === SITE_PATH.home) return SITE_PATH.home;

  const normalized = s.replace(/^\/+/, "");
  return `/${normalized}`;
}
