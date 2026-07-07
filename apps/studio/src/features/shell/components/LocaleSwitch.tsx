"use client";

/**
 * @file apps/studio/src/features/shell/components/LocaleSwitch.tsx
 * @layer studio/features/shell/components
 *
 * @description
 * Studio locale switcher backed by the configured i18n routes.
 *
 * @remarks
 * - Uses the current pathname and replaces only the locale segment so the user stays on the same page.
 */

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@compoz/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@compoz/ui/components/ui/dropdown-menu";
import { cn } from "@compoz/ui/lib/utils";

import { routing } from "@compoz/studio/i18n/routing";

export function LocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(nextLocale: string) {
    if (nextLocale === locale) return;

    const segments = pathname.split("/");
    segments[1] = nextLocale; // Replace the `[locale]` route segment.

    router.push(segments.join("/"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="header"
          visualMode="studio"
          size="icon"
          aria-label={t("common.language")}
        >
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        visualMode="studio"
        align="end"
        className="mt-0.5 min-w-10 font-semibold"
      >
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            visualMode="studio"
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

LocaleSwitch.displayName = "LocaleSwitch";
