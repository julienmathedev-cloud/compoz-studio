"use client";

/**
 * @file apps/studio/src/components/atoms/LoadingStatus.tsx
 * @layer studio/atoms
 *
 * @description
 * Accessible loading status for the Studio UI.
 *
 * @remarks
 * - Uses `role="status"` and `aria-live="polite"` for announcements.
 * - Can display a spinner through `StudioIcon`.
 */

import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";

import { Spinner } from "@compoz/ui/components/ui/spinner";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM } from "@compoz/ui/styles/studio/layout";

export type LoadingStatusProps = Readonly<{
  label?: string;
  children?: ReactNode;
  withSpinner?: boolean;
  className?: string;
}> &
  HTMLAttributes<HTMLSpanElement>;

export function LoadingStatus({
  label,
  children,
  withSpinner = true,
  ...rest
}: LoadingStatusProps) {
  const t = useTranslations();
  const desc = label ?? t("common.loading");

  return (
    <span
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(ROW_SM, "min-w-24", rest.className)}
      {...rest}
    >
      {withSpinner && <StudioIcon icon={Spinner} />}

      {children && (
        <Text as="span" variant="muted">
          {children}
        </Text>
      )}

      {desc}
    </span>
  );
}

LoadingStatus.displayName = "LoadingStatus";
