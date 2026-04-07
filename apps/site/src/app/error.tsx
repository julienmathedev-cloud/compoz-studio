"use client";

/**
 * @file apps/site/src/app/error.tsx
 * @layer site/app
 *
 * @description
 * Error boundary UI du site.
 * Affiche un fallback stable + actions (réessayer + retour accueil).
 *
 * @remarks
 * - Composant client obligatoire (Next.js error boundary).
 * - UI skinnable via `SiteUiProvider` : `ui.systemPage`.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { SiteSystemPage } from "@compoz/ui/site/components/system/SiteSystemPage";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

type SiteErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function SiteError({ error, reset }: SiteErrorProps) {
  const ui = useSiteUi();

  const pathname = usePathname() || "/";
  const homeHref = resolveInternalHref(pathname, "/");

  useEffect(() => {
    void error;
  }, [error]);

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
            <Link href={homeHref} className="no-underline">
              Aller à l’accueil
            </Link>
          </Button>
        </>
      }
    />
  );
}

SiteError.displayName = "SiteError";
