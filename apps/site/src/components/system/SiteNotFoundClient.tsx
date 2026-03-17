"use client";

/**
 * @file apps/site/src/components/system/SiteNotFoundClient.tsx
 * @layer site/components/system
 *
 * @description
 * UI client de la page 404 du site.
 *
 * @remarks
 * - UI skinnable via `SiteUiProvider` : `ui.systemPage`.
 * - Conserve header/footer via layout segment.
 * - Convention V0.5 : plus de querystring `state` (draft/published via routes dédiées).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { SiteSystemPage } from "@compoz/ui/site/components/system/SiteSystemPage";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

export function SiteNotFoundClient() {
  const ui = useSiteUi();

  const pathname = usePathname() || "/";
  const homeHref = resolveInternalHref(pathname, "/");

  return (
    <SiteSystemPage
      ui={ui.systemPage}
      title="Page introuvable"
      description="La page que vous cherchez n’existe pas ou a été déplacée."
      actions={
        <Button
          asChild
          variant="outlineVanilla"
          className={cn(ui.systemPage?.button)}
        >
          <Link href={homeHref} className="no-underline">
            Retour à l’accueil
          </Link>
        </Button>
      }
    />
  );
}

SiteNotFoundClient.displayName = "SiteNotFoundClient";
