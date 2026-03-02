"use client";

/**
 * @file packages/ui/src/site/features/system/PublicSystemLoading.tsx
 * @layer ui/public/system
 *
 * @description
 * UI-only : loading global du public (spinner centré), skinnable via `PublicUiProvider`.
 *
 * @remarks
 * - Ne contient aucune logique métier.
 * - Styles via `ui.systemLoading`.
 */

import { Spinner } from "@compoz/ui/components/ui/spinner";
import { cn } from "@compoz/ui/lib/utils";
import { usePublicUi } from "@compoz/ui/site/providers/PublicUiProvider";

export function PublicSystemLoading() {
  const ui = usePublicUi();
  return (
    <div className={cn(ui.systemLoading.container)}>
      <Spinner
        className={cn(ui.systemLoading.spinner)}
        aria-label="Chargement"
      />
    </div>
  );
}

PublicSystemLoading.displayName = "PublicSystemLoading";
