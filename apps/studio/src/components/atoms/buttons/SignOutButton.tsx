"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/SignOutButton.tsx
 * @layer studio/atoms
 *
 * @description
 * Bouton de déconnexion (Auth.js / NextAuth) pour l’interface Studio.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Appelle `signOut()` côté client.
 * - Redirige vers la page de login après déconnexion.
 * - Utilise TooltipButton + StudioIcon (standard header).
 */

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";

/**
 * Déconnecte l’utilisateur et renvoie vers `/[locale]/signin` via `callbackUrl`.
 */
export function SignOutButton() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <TooltipButton
      type="button"
      variant="headerStudio"
      size="icon"
      aria-label={t("studio.login.signOut")}
      tooltip={t("studio.login.signOut")}
      onClick={() => {
        void signOut({ callbackUrl: `/${locale}/signin` });
      }}
    >
      <StudioIcon icon={LogOut} />
    </TooltipButton>
  );
}

SignOutButton.displayName = "SignOutButton";
