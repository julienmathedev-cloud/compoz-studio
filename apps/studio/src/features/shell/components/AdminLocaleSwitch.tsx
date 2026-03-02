"use client";

/**
 * @file apps/studio/src/features/shell/components/AdminLocaleSwitch.tsx
 * @layer ui/atoms
 *
 * @description
 * Sélecteur de langue pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Dérive la locale courante via `next-intl`.
 * - Met à jour l’URL en remplaçant le segment `[locale]`.
 */

import { Button } from "@compoz/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@compoz/ui/components/ui/dropdown-menu";
import { cn } from "@compoz/ui/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { routing } from "@compoz/studio/i18n/routing";

/**
 * Affiche un sélecteur de langue (admin) basé sur ShadCN `Select`.
 */
export function AdminLocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(nextLocale: string) {
    if (nextLocale === locale) return;

    const segments = pathname.split("/");
    segments[1] = nextLocale; // remplace [locale]

    router.push(segments.join("/"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="header" size="icon" aria-label={t("common.language")}>
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="mt-0.5 min-w-10 font-semibold"
      >
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onSelect={() => onLocaleChange(loc)}
            className={cn(
              loc === locale && "bg-primary text-primary-foreground",
              "w-8 mt-0.5",
            )}
          >
            {loc.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
