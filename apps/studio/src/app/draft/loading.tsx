/**
 * @file apps/studio/src/app/draft/loading.tsx
 * @layer studio/app
 *
 * @description
 * Loading UI pour la route "/draft" (preview DRAFT dans l’app Studio).
 *
 * @remarks
 * - Rendu skinnable via `SiteUiProvider` (ui.systemLoading).
 * - Convention V0.5 : draft preview = "/draft".
 */

import { SiteSystemLoading } from "@compoz/ui/site/components/system/SiteSystemLoading";

export default function DraftLoading() {
  return <SiteSystemLoading />;
}

DraftLoading.displayName = "DraftLoading";
