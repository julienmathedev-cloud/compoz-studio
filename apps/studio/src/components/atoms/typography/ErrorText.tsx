"use client";

/**
 * @file apps/studio/src/components/atoms/typography/ErrorText.tsx
 * @layer ui/atoms
 */

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { normalizeString } from "@compoz/ui/lib/normalize";

export type ErrorTextProps = Readonly<{
  as?: "p" | "span";
  withRoleAlert?: boolean;
  error: string;
}> &
  ComponentPropsWithoutRef<"p">;

function isUiToken(input: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(input);
}

function isDomainToken(input: string): boolean {
  return /^[A-Z0-9_]+$/.test(input);
}

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

  let text: string;

  if (isDomainToken(message)) {
    text = tErrors(message, { default: message });
  } else if (isUiToken(message)) {
    text = tUi(message, { default: message });
  } else {
    // Déjà un message lisible
    text = message;
  }

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
