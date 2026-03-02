/**
 * @file apps/site/src/app/loading.tsx
 * @layer app/site
 *
 * @description
 * Loading UI pour le segment public.
 *
 * @remarks
 * - Rendu skinnable via `PublicUiProvider` (ui.systemLoading).
 */

import { PublicSystemLoading } from "@compoz/ui/site/components/system/PublicSystemLoading";

export default function PublicLoading() {
  return <PublicSystemLoading />;
}

PublicLoading.displayName = "PublicLoading";
