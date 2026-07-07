/**
 * @file apps/studio/src/app/draft/loading.tsx
 * @layer studio/app
 *
 * @description
 * Loading UI for the `/draft` route in the Studio draft preview.
 *
 * @remarks
 * - Skinnable through `ui.systemLoading`.
 * - V0.5 convention: draft preview uses `/draft`.
 */

import { SiteSystemLoading } from "@compoz/ui/site/components/system/SiteSystemLoading";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function DraftLoading() {
  const ui = resolveSiteUi();

  return <SiteSystemLoading ui={ui} />;
}

DraftLoading.displayName = "DraftLoading";
