"use client";

/**
 * @file apps/studio/src/features/shell/components/Header.tsx
 * @layer ui/studio/layouts
 *
 * @description
 * En-tête persistant de l’interface Studio.
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Positionné en sticky pour rester visible au scroll.
 * - Inclut un skip link pour l’accessibilité clavier.
 * - Version actuelle sans navigation dynamique.
 */

import { SignOutButton } from "@compoz/studio/components/atoms/buttons/SignOutButton";
import { ThemeToggle } from "@compoz/studio/components/atoms/buttons/ThemeToggle";
import { LocaleSwitch } from "@compoz/studio/features/shell/components/LocaleSwitch";
import { SidebarTrigger } from "@compoz/ui/components/ui/sidebar";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

/**
 * Header principal de l’interface Studio.
 */
export function Header() {
  const t = useTranslations();

  return (
    <header
      aria-label={t("studio.header.ariaLabel")}
      className="sticky top-0 z-40 w-full bg-sidebar backdrop-blur supports-backdrop-filter:bg-sidebar items-center h-10"
    >
      {/* Skip link : rendu visible uniquement au focus */}
      {/* Skip link : invisible + non cliquable tant qu’il n’a pas le focus */}
      <a
        href="#main"
        className={cn(
          "sr-only",
          // Tant qu'il n'est pas focus → ne capte rien
          "pointer-events-none select-none",
          // Quand focus → visible + cliquable
          "focus:not-sr-only focus:pointer-events-auto focus:select-text",
          // Placement au-dessus de tout uniquement quand focus
          "focus:fixed focus:left-2 focus:top-2 focus:z-1000",
          "focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
        )}
      >
        {t("studio.header.skipToContent")}
      </a>

      {/* Contenu principal du header */}
      <div className={cn(ROW_BETWEEN, "w-full items-center h-10")}>
        <SidebarTrigger className="ml-2" />

        {/* Espace actions — bouton placeholder pour V0.5 */}
        <div className={cn("flex items-center gap-0.5", "mr-2")}>
          <ThemeToggle />
          <LocaleSwitch />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

Header.displayName = "Header";
