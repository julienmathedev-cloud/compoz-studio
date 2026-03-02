"use client";

/**
 * @file apps/studio/src/app/draft/error.tsx
 * @layer app/studio/draft
 *
 * @description
 * Error boundary UI pour le segment public "/draft".
 * Affiche un fallback stable + actions (réessayer + retour accueil).
 *
 * @remarks
 * - Composant client obligatoire (Next.js error boundary).
 * - UI skinnable via `PublicUiProvider` (skin public) : `ui.errorPage`.
 * - Convention V0.5 : draft preview = "/draft" (pas de querystring state).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { usePublicUi } from "@compoz/ui/site/providers/PublicUiProvider";
import { PublicSystemPage } from "@compoz/ui/site/components/system/PublicSystemPage";
import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";

type PublicErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DraftError({ error, reset }: PublicErrorProps) {
  const ui = usePublicUi();

  // ✅ Convention : home draft preview = "/draft"
  const pathname = usePathname() || "/";
  const homeHref = resolveInternalHref(pathname, "/");

  useEffect(() => {
    // Hook utile si tu veux logger plus tard
    void error;
  }, [error]);

  return (
    <PublicSystemPage
      ui={ui.systemPage}
      title="Une erreur est survenue"
      description="Impossible d’afficher cette page pour le moment. Vous pouvez réessayer."
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            className={cn(ui.systemPage.button)}
            onClick={reset}
          >
            Réessayer
          </Button>

          <Button
            type="button"
            variant="outline"
            className={cn(ui.systemPage.button)}
            asChild
          >
            <Link href={homeHref} className="no-underline">
              Aller à l’accueil
            </Link>
          </Button>
        </>
      }
    />
  );
}

DraftError.displayName = "DraftError";
