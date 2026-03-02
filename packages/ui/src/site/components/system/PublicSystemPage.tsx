"use client";

/**
 * @file packages/ui/src/site/features/system/PublicSystemPage.tsx
 * @layer ui/public/system
 *
 * @description
 * Layout UI-only réutilisable pour les "system pages" du public (error, not-found, etc.).
 *
 * @remarks
 * - 100% skinnable via `PublicUiProvider`.
 * - Ne contient aucune logique métier : uniquement structure + classes.
 * - Les actions (boutons/liens) sont injectées via `actions`.
 */

import { cn } from "@compoz/ui/lib/utils";
import { PublicHeading } from "@compoz/ui/site/components/atoms/PublicHeading";
import type { PublicSystemPageUi } from "@compoz/ui/site/public-ui.types";
import type { ReactNode } from "react";

export type PublicSystemPageProps = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;

  /**
   * Classes optionnelles (override local).
   * En pratique, tu passes plutôt `ui` depuis le resolver via `usePublicUi()`.
   */
  ui: PublicSystemPageUi;
}>;

/**
 * Composant système réutilisable.
 */
export function PublicSystemPage({
  title,
  description,
  actions,
  ui,
}: PublicSystemPageProps) {
  return (
    <main className={cn(ui.main)}>
      <div className={cn(ui.prose)}>
        <PublicHeading level={1} className={cn(ui.title)}>
          {title}
        </PublicHeading>

        {description ? (
          <p className={cn(ui.description)}>{description}</p>
        ) : null}

        {actions ? <div className={cn(ui.actions)}>{actions}</div> : null}
      </div>
    </main>
  );
}

PublicSystemPage.displayName = "PublicSystemPage";
