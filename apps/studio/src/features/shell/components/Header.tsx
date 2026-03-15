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
 * - La zone gauche est injectée via `leftSlot` (sidebar trigger, badge, etc.).
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SignOutButton } from "@compoz/studio/components/atoms/buttons/SignOutButton";
import { ThemeToggle } from "@compoz/studio/components/atoms/buttons/ThemeToggle";
import { LocaleSwitch } from "@compoz/studio/features/shell/components/LocaleSwitch";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN, ROW_END } from "@compoz/ui/styles/studio/layout";

type HeaderProps = Readonly<{
  leftSlot?: ReactNode;
}>;

/**
 * Header principal de l’interface Studio.
 */
export function Header({ leftSlot }: HeaderProps) {
  const t = useTranslations();

  return (
    <header
      aria-label={t("studio.header.ariaLabel")}
      className="sticky top-0 z-40 h-10 w-full items-center bg-sidebar backdrop-blur supports-backdrop-filter:bg-sidebar"
    >
      <a
        href="#main"
        className={cn(
          "sr-only",
          "pointer-events-none select-none",
          "focus:not-sr-only focus:pointer-events-auto focus:select-text",
          "focus:fixed focus:left-2 focus:top-2 focus:z-1000",
          "focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
        )}
      >
        {t("studio.header.skipToContent")}
      </a>

      <div
        className={cn(
          leftSlot ? ROW_BETWEEN : ROW_END,
          "h-10 w-full items-center",
        )}
      >
        {leftSlot ? (
          <div className="ml-2 flex min-w-0 items-center">{leftSlot}</div>
        ) : null}

        <div className={cn("mr-2 flex items-center gap-0.5")}>
          <ThemeToggle />
          <LocaleSwitch />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

Header.displayName = "Header";
