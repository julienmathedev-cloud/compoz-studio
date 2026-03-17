/**
 * @file apps/site/src/app/loading.tsx
 * @layer site/app
 *
 * @description
 * Loading UI pour le segment site.
 *
 * @remarks
 * - Rendu skinnable via `ui.systemLoading`.
 */

import { SiteSystemLoading } from "@compoz/ui/site/components/system/SiteSystemLoading";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function SiteLoading() {
  const ui = resolveSiteUi();

  return <SiteSystemLoading ui={ui} />;
}

SiteLoading.displayName = "SiteLoading";
