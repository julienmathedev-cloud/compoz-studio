"use client";

/**
 * @file apps/studio/src/app/draft/error.tsx
 * @layer studio/app
 *
 * @description
 * Error boundary UI pour la route "/draft".
 * Affiche un fallback stable + actions (réessayer + retour accueil).
 *
 * @remarks
 * - Composant client obligatoire (Next.js error boundary).
 * - UI skinnable via `SiteUiProvider` : `ui.systemPage`.
 * - Convention V0.5 : draft preview = "/draft" (pas de querystring state).
 */

import Link from "next/link";

import { STUDIO_PATH } from "@compoz/core/constants/web/paths";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteSystemPage } from "@compoz/ui/site/components/system/SiteSystemPage";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

type DraftErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DraftError({ reset }: DraftErrorProps) {
  const ui = useSiteUi();

  return (
    <SiteSystemPage
      ui={ui.systemPage}
      title="Une erreur est survenue"
      description="Impossible d’afficher cette page pour le moment. Vous pouvez réessayer."
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            visualMode="vanilla"
            className={cn(ui.systemPage.button)}
            onClick={reset}
          >
            Réessayer
          </Button>

          <Button
            type="button"
            variant="outline"
            visualMode="vanilla"
            className={cn(ui.systemPage.button)}
            asChild
          >
            <Link href={STUDIO_PATH.draft} className="no-underline">
              Aller à l’accueil
            </Link>
          </Button>
        </>
      }
    />
  );
}

DraftError.displayName = "DraftError";
