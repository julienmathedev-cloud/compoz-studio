/**
 * @file packages/ui/src/site/features/system/SiteSystemLoading.tsx
 * @layer ui/site/system
 *
 * @description
 * UI-only : loading global du site public (spinner centré).
 *
 * @remarks
 * - Ne contient aucune logique métier.
 * - Styles via `ui.systemLoading`.
 * - Composant server-friendly : consomme `ui` en props.
 */

import { Spinner } from "@compoz/ui/components/ui/spinner";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";

export type SiteSystemLoadingProps = Readonly<{
  ui: SiteGlobalUi;
}>;

export function SiteSystemLoading({ ui }: SiteSystemLoadingProps) {
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
