"use client";

/**
 * @file apps/site/src/app/error.tsx
 * @layer app/site
 *
 * @description
 * Error boundary UI pour le segment public "/site".
 * Affiche un fallback stable + actions (réessayer + retour accueil).
 *
 * @remarks
 * - Composant client obligatoire (Next.js error boundary).
 * - UI skinnable via `PublicUiProvider` (skin public) : `ui.errorPage`.
 * - Convention V0.5 : published preview = "/site" (pas de querystring state).
 */

import Link from "next/link";
import { useEffect } from "react";

import { PublicSystemPage } from "@compoz/ui/site/components/system/PublicSystemPage";
import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { usePublicUi } from "@compoz/ui/site/providers/PublicUiProvider";
import { usePathname } from "next/navigation";

type PublicErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function PublicError({ error, reset }: PublicErrorProps) {
  const ui = usePublicUi();

  // ✅ Convention : home published preview = "/site"
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

PublicError.displayName = "PublicError";
