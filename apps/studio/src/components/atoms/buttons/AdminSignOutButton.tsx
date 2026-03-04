"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/AdminSignOutButton.tsx
 * @layer ui/atoms
 *
 * @description
 * Bouton de déconnexion (Auth.js / NextAuth) pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Appelle `signOut()` côté client.
 * - Redirige vers la page de login après déconnexion.
 * - Utilise TooltipButton + AdminIcon (standard header).
 */

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";

/**
 * Déconnecte l’utilisateur et renvoie vers /signin (localisé si possible via callbackUrl).
 */
export function AdminSignOutButton() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <TooltipButton
      type="button"
      variant="header"
      size="icon"
      aria-label={t("admin.login.signOut")}
      tooltip={t("admin.login.signOut")}
      onClick={() => {
        // callbackUrl: tu peux choisir une route post-logout (ici: /fr/signin par défaut)
        void signOut({ callbackUrl: `/${locale}/signin` });
      }}
    >
      <AdminIcon icon={LogOut} />
    </TooltipButton>
  );
}

AdminSignOutButton.displayName = "AdminSignOutButton";
