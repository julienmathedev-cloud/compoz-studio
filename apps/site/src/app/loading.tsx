/**
 * @file apps/site/src/app/loading.tsx
 * @layer site/app
 *
 * @description
 * Loading UI pour le segment site.
 *
 * @remarks
 * - Rendu skinnable via `SiteUiProvider` (ui.systemLoading).
 */

import { SiteSystemLoading } from "@compoz/ui/site/components/system/SiteSystemLoading";

export default function SiteLoading() {
  return <SiteSystemLoading />;
}

SiteLoading.displayName = "SiteLoading";
