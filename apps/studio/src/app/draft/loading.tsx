/**
 * @file apps/studio/src/app/draft/loading.tsx
 * @layer studio/app
 *
 * @description
 * Loading UI pour la route "/draft" (preview DRAFT dans l’app Studio).
 *
 * @remarks
 * - Rendu skinnable via `ui.systemLoading`.
 * - Convention V0.5 : draft preview = "/draft".
 */

import { SiteSystemLoading } from "@compoz/ui/site/components/system/SiteSystemLoading";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function DraftLoading() {
  const ui = resolveSiteUi();

  return <SiteSystemLoading ui={ui} />;
}

DraftLoading.displayName = "DraftLoading";
