/**
 * @file apps/studio/src/app/draft/loading.tsx
 * @layer app/public
 *
 * @description
 * Loading UI pour le segment public "/draft".
 *
 * @remarks
 * - Rendu skinnable via `PublicUiProvider` (ui.systemLoading).
 * - Convention V0.5 : draft preview = "/draft".
 */

import { PublicSystemLoading } from "@compoz/ui/site/components/system/PublicSystemLoading";

export default function DraftLoading() {
  return <PublicSystemLoading />;
}

DraftLoading.displayName = "DraftLoading";
