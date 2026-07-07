/**
 * @file packages/ui/src/site/components/system/SiteSystemLoading.tsx
 * @layer ui/site/components/system
 *
 * @description
 * Renders the public site global loading state with a centered spinner.
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
