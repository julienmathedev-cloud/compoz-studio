"use client";

/**
 * @file packages/ui/src/site/features/system/SiteSystemLoading.tsx
 * @layer ui/site/system
 *
 * @description
 * UI-only : loading global du site public (spinner centré), skinnable via `SiteUiProvider`.
 *
 * @remarks
 * - Ne contient aucune logique métier.
 * - Styles via `ui.systemLoading`.
 */

import { Spinner } from "@compoz/ui/components/ui/spinner";
import { cn } from "@compoz/ui/lib/utils";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

export function SiteSystemLoading() {
  const ui = useSiteUi();

  return (
    <div className={cn(ui.systemLoading.container)}>
      <Spinner
        className={cn(ui.systemLoading.spinner)}
        aria-label="Chargement"
      />
    </div>
  );
}

SiteSystemLoading.displayName = "SiteSystemLoading";
