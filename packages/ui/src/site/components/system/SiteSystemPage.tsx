/**
 * @file packages/ui/src/site/components/system/SiteSystemPage.tsx
 * @layer ui/site/components/system
 *
 * @description
 * Renders a reusable public site system page layout for error, not-found, and similar states.
 *
 * @remarks
 * Actions are injected by the caller; this component only owns structure and skin-provided classes.
 */

import type { ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import type { SiteSystemPageUi } from "@compoz/ui/site/site-ui.types";

export type SiteSystemPageProps = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;

  ui: SiteSystemPageUi;
}>;

export function SiteSystemPage({
  title,
  description,
  actions,
  ui,
}: SiteSystemPageProps) {
  return (
    <main className={cn(ui.main)}>
      <div className={cn(ui.prose)}>
        <h1 className={cn(ui.title)}>{title}</h1>

        {description ? (
          <p className={cn(ui.description)}>{description}</p>
        ) : null}

        {actions ? <div className={cn(ui.actions)}>{actions}</div> : null}
      </div>
    </main>
  );
}

SiteSystemPage.displayName = "SiteSystemPage";
