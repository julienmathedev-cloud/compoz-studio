"use client";

/**
 * @file apps/studio/src/components/atoms/typography/ErrorText.tsx
 * @layer studio/atoms
 *
 * @description
 * Texte d’erreur standardisé (UI) avec résolution i18n :
 * - `uiErrors.<token>` pour les erreurs UI (camelCase)
 * - `errors.<CODE>` pour les erreurs domaine (MAJUSCULE_SNAKE_CASE)
 *
 * @remarks
 * - Rend `null` si le message est vide après normalisation.
 * - Peut activer `role="alert"` pour l’accessibilité.
 */

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { resolveMessage } from "@compoz/studio/lib/ui/resolve-ui-message";
import { normalizeString } from "@compoz/ui/lib/normalize";

export type ErrorTextProps = Readonly<{
  as?: "p" | "span";
  withRoleAlert?: boolean;
  error: string;
}> &
  ComponentPropsWithoutRef<"p">;

/**
 * Affiche un message d’erreur résolu (token → i18n) ou brut (message humain).
 */
export function ErrorText({
  as = "p",
  withRoleAlert = false,
  error,
  ...rest
}: ErrorTextProps) {
  const tErrors = useTranslations("errors");
  const tUi = useTranslations("uiErrors");

  const message = normalizeString(error);
  if (!message) return null;

  const text = resolveMessage(message, (key) => {
    if (key.startsWith("errors.")) {
      return tErrors(key.slice("errors.".length), { default: message });
    }
    if (key.startsWith("uiErrors.")) {
      return tUi(key.slice("uiErrors.".length), { default: message });
    }
    return message;
  });

  return (
    <Text
      as={as}
      variant="error"
      {...(withRoleAlert && {
        role: "alert",
        "aria-live": "polite",
        "aria-atomic": "true",
      })}
      {...rest}
    >
      {text}
    </Text>
  );
}

ErrorText.displayName = "ErrorText";
