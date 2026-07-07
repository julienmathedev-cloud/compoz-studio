/**
 * @file apps/site/src/app/not-found.tsx
 * @layer site/app
 *
 * @description
 * Site-level 404 page rendered as a Server Component.
 *
 * @remarks
 * - `not-found.tsx` must stay server-side, without `"use client"`.
 * - Dynamic UI details such as pathname and search params are delegated to a client component.
 */

import { SiteNotFoundClient } from "@compoz/site/components/system/SiteNotFoundClient";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function SiteNotFound() {
  const ui = resolveSiteUi();

  return <SiteNotFoundClient ui={ui.systemPage} />;
}

SiteNotFound.displayName = "SiteNotFound";
