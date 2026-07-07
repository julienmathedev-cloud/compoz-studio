"use client";

/**
 * @file apps/studio/src/components/molecules/fields/ButtonIconFields.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Composite field for configuring a button icon and its position.
 *
 * @remarks
 * - Groups the picker trigger, selected icon preview, icon picker, and position select.
 * - Stays React Hook Form agnostic: values are fully controlled by props.
 * - Reusable for button-like controls such as ButtonsCell, FormCell submit buttons, and StructuredCard CTA buttons.
 */

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { IconPicker } from "@compoz/studio/components/molecules/fields/IconPicker";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import {
  getContentIconLabel,
  isContentIconKind,
  renderContentIcon,
} from "@compoz/ui/lib/icons/content-icons";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";

const BUTTON_ICON_POSITIONS = ["before", "after"] as const;

type ButtonIconPosition = (typeof BUTTON_ICON_POSITIONS)[number];

export type ButtonIconFieldsProps = Readonly<{
  idPrefix: string;
  icon: ContentIconKind | null;
  iconPosition: ButtonIconPosition;
  onIconChange: (next: ContentIconKind | null) => void;
  onIconPositionChange: (next: ButtonIconPosition) => void;
  disabled?: boolean;
  className?: string;
}>;

export function ButtonIconFields({
  idPrefix,
  icon,
  iconPosition,
  onIconChange,
  onIconPositionChange,
  disabled = false,
  className,
}: ButtonIconFieldsProps) {
  const t = useTranslations();
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const iconPositionIds = createFieldIds(idPrefix, "iconPosition");

  const normalizedIcon = icon && isContentIconKind(icon) ? icon : null;
  const normalizedIconPosition: ButtonIconPosition =
    iconPosition === "after" ? "after" : "before";

  const selectedIconPreview: ReactNode = normalizedIcon
    ? renderContentIcon(normalizedIcon, { className: "h-4 w-4" })
    : null;

  const selectedIconLabel = normalizedIcon
    ? getContentIconLabel(normalizedIcon)
    : null;

  return (
    <div className={cn(STACK_MD, className)}>
      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.buttonsCellEditor.iconLabel")}
        </Text>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsIconPickerOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-lg border border-border -mt-0.5 px-3 py-1.5 text-left",
            "transition-colors",
            "hover:bg-accent/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
            disabled && "cursor-not-allowed opacity-60",
          )}
          aria-expanded={isIconPickerOpen}
          aria-label={t("studio.cellEditorTabs.buttonsCellEditor.iconLabel")}
        >
          <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            {selectedIconPreview ? (
              <>
                {selectedIconPreview}
                <span className="truncate">{selectedIconLabel}</span>
              </>
            ) : (
              <span className="truncate">
                {t("studio.cellEditorTabs.buttonsCellEditor.iconHelp")}
              </span>
            )}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isIconPickerOpen && "rotate-180",
            )}
          />
        </button>

        {isIconPickerOpen ? (
          <IconPicker
            value={normalizedIcon}
            onChange={(next) => {
              if (next === null) {
                onIconChange(null);
                return;
              }

              if (!isContentIconKind(next)) {
                onIconChange(null);
                return;
              }

              onIconChange(next);
            }}
            disabled={disabled}
          />
        ) : null}

        <Text as="p" className="text-xs text-muted-foreground">
          {t("studio.cellEditorTabs.buttonsCellEditor.iconHelp")}
        </Text>
      </div>

      <SelectField
        ids={iconPositionIds}
        label={t("studio.cellEditorTabs.buttonsCellEditor.iconPositionLabel")}
        value={normalizedIconPosition}
        onChange={(next) => {
          onIconPositionChange(next === "after" ? "after" : "before");
        }}
        items={BUTTON_ICON_POSITIONS.map((position) => ({
          value: position,
          label: t(
            `studio.cellEditorTabs.buttonsCellEditor.iconPositions.${position}`,
          ),
        }))}
        disabled={disabled}
        help={t("studio.cellEditorTabs.buttonsCellEditor.iconPositionHelp")}
      />
    </div>
  );
}

ButtonIconFields.displayName = "ButtonIconFields";
