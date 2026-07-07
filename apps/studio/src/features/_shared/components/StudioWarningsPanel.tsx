"use client";

/**
 * @file apps/studio/src/features/_shared/components/StudioWarningsPanel.tsx
 * @layer studio/features/_shared/components
 *
 * @description
 * Reusable Studio settings panel for translated non-blocking warning messages.
 *
 * @remarks
 * - Translates warning keys through the business i18n prefix provided by the parent.
 * - Delegates the expandable panel rendering to `StudioHintsPanel`.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { StudioHintsPanel } from "@compoz/studio/features/_shared/components/StudioHintsPanel";

type StudioWarningsPanelProps<TWarningKey extends string> = Readonly<{
  id: string;
  warningKeys: readonly TWarningKey[];
  /** Business i18n prefix used to resolve warning messages. */
  warningMessageKeyPrefix: string;
}>;

export function StudioWarningsPanel<TWarningKey extends string>({
  id,
  warningKeys,
  warningMessageKeyPrefix,
}: StudioWarningsPanelProps<TWarningKey>) {
  const t = useTranslations();

  const warningHints = useMemo(
    () =>
      warningKeys.map((key) => t(`${warningMessageKeyPrefix}.${String(key)}`)),
    [warningKeys, warningMessageKeyPrefix, t],
  );

  return <StudioHintsPanel id={id} hints={warningHints} variant="warning" />;
}

StudioWarningsPanel.displayName = "StudioWarningsPanel";
