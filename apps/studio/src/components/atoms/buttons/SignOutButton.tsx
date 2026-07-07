"use client";

/**
 * @file apps/studio/src/components/atoms/buttons/SignOutButton.tsx
 * @layer studio/atoms
 *
 * @description
 * Studio sign-out button for Auth.js / NextAuth.
 *
 * @remarks
 * - Redirects to the localized sign-in page after sign-out.
 * - Preserves a localized `next` destination to avoid returning to the default locale after sign-in.
 */

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";

export function SignOutButton() {
  const locale = useLocale();
  const t = useTranslations();

  const signinPath = `/${locale}/signin`;
  const nextPath = `/${locale}`;

  return (
    <TooltipButton
      type="button"
      variant="header"
      visualMode="studio"
      size="icon"
      aria-label={t("studio.login.signOut")}
      tooltip={t("studio.login.signOut")}
      onClick={() => {
        void signOut({
          callbackUrl: `${signinPath}?next=${encodeURIComponent(nextPath)}`,
        });
      }}
    >
      <StudioIcon icon={LogOut} />
    </TooltipButton>
  );
}

SignOutButton.displayName = "SignOutButton";
