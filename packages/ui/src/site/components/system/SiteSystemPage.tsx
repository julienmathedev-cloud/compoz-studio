/**
 * @file packages/ui/src/site/features/system/SiteSystemPage.tsx
 * @layer ui/site/system
 *
 * @description
 * Layout UI-only réutilisable pour les "system pages" du site public (error, not-found, etc.).
 *
 * @remarks
 * - 100% skinnable via le design system site.
 * - Ne contient aucune logique métier : uniquement structure + classes.
 * - Les actions (boutons/liens) sont injectées via `actions`.
 * - Ce composant reste server-friendly et consomme `ui` en props.
 */

import type { ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import { SiteHeading } from "@compoz/ui/site/components/atoms/SiteHeading";
import type { SiteSystemPageUi } from "@compoz/ui/site/site-ui.types";

export type SiteSystemPageProps = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;

  /**
   * UI résolue (skin/template) + override local éventuel.
   */
  ui: SiteSystemPageUi;
}>;

/**
 * Layout système réutilisable.
 */
export function SiteSystemPage({
  title,
  description,
  actions,
  ui,
}: SiteSystemPageProps) {
  return (
    <main className={cn(ui.main)}>
      <div className={cn(ui.prose)}>
        <SiteHeading level={1} className={cn(ui.title)}>
          {title}
        </SiteHeading>

        {description ? (
          <p className={cn(ui.description)}>{description}</p>
        ) : null}

        {actions ? <div className={cn(ui.actions)}>{actions}</div> : null}
      </div>
    </main>
  );
}

SiteSystemPage.displayName = "SiteSystemPage";
