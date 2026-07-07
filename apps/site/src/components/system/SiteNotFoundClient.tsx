"use client";

/**
 * @file apps/site/src/components/system/SiteNotFoundClient.tsx
 * @layer site/components/system
 *
 * @description
 * Client UI for the site 404 page.
 *
 * @remarks
 * - Reads the current pathname so the home action can preserve the active routing context.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@compoz/ui/components/ui/button";
import { resolveInternalHref } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { SiteSystemPage } from "@compoz/ui/site/components/system/SiteSystemPage";
import type { SiteSystemPageUi } from "@compoz/ui/site/site-ui.types";

export type SiteNotFoundClientProps = Readonly<{
  ui: SiteSystemPageUi;
}>;

export function SiteNotFoundClient({ ui }: SiteNotFoundClientProps) {
  const pathname = usePathname() || "/";
  const homeHref = resolveInternalHref(pathname, "/");

  return (
    <SiteSystemPage
      ui={ui}
      title="Page introuvable"
      description="La page que vous cherchez n’existe pas ou a été déplacée."
      actions={
        <Button
          asChild
          variant="outline"
          visualMode="vanilla"
          className={cn(ui.button)}
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
