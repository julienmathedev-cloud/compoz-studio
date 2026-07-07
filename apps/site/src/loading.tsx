/**
 * @file apps/site/src/loading.tsx
 * @layer site/app
 *
 * @description
 * Loading UI for the public site segment.
 *
 * @remarks
 * - Uses the resolved site UI skin through `ui.systemLoading`.
 */

import { SiteSystemLoading } from "@compoz/ui/site/components/system/SiteSystemLoading";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function SiteLoading() {
  const ui = resolveSiteUi();

  return <SiteSystemLoading ui={ui} />;
}

SiteLoading.displayName = "SiteLoading";
