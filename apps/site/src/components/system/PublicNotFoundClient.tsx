"use client";

/**
 * @file packages/ui/src/featuressystem/PublicNotFoundClient.tsx
 * @layer ui/public/system
 *
 * @description
 * UI client de la page 404 public.
 *
 * @remarks
 * - UI skinnable via `PublicUiProvider` : `ui.notFoundPage`.
 * - Conserve header/footer via layout segment.
 * - Convention V0.5 : plus de querystring `state` (draft/published via routes dédiées).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { PublicSystemPage } from "@compoz/ui/site/components/system/PublicSystemPage";
import { usePublicUi } from "@compoz/ui/site/providers/PublicUiProvider";

export function PublicNotFoundClient() {
  const ui = usePublicUi();

  const pathname = usePathname() || "/";
  const homeHref = resolveInternalHref(pathname, "/");

  return (
    <PublicSystemPage
      ui={ui.systemPage}
      title="Page introuvable"
      description="La page que vous cherchez n’existe pas ou a été déplacée."
      actions={
        <Button asChild variant="outline" className={cn(ui.systemPage?.button)}>
          <Link href={homeHref} className="no-underline">
            Retour à l’accueil
          </Link>
        </Button>
      }
    />
  );
}

PublicNotFoundClient.displayName = "PublicNotFoundClient";
