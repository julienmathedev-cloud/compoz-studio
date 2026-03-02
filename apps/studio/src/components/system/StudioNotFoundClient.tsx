"use client";

/**
 * @file apps/studio/src/components/system/StudioNotFoundClient.tsx
 * @layer ui/public/system
 *
 * @description
 * UI client de la page 404 public studio.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { PublicSystemPage } from "@compoz/ui/site/components/system/PublicSystemPage";
import { usePublicUi } from "@compoz/ui/site/providers/PublicUiProvider";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";

export function StudioNotFoundClient() {
  const ui = usePublicUi();

  const pathname = usePathname() || "/";
  const homeHref = resolveInternalHref(pathname, "/");

  return (
    <PublicSystemPage
      ui={ui.systemPage}
      title="Page introuvable"
      description="La page que vous cherchez n’existe pas ou a été déplacée."
      actions={
        <div className={cn(ROW_BETWEEN, "w-full gap-2")}>
          <Button
            asChild
            variant="outline"
            className={cn(ui.systemPage?.button)}
          >
            <Link href={homeHref} className="no-underline">
              Retour à l’accueil
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={"/"} className="no-underline">
              Retour au studio
            </Link>
          </Button>
        </div>
      }
    />
  );
}

StudioNotFoundClient.displayName = "StudioNotFoundClient";
