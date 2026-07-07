"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/SpacerCellEditor.tsx
 * @layer studio/features/builder/editor/cells
 *
 * @description
 * Controlled SpacerCell editor for size and responsive visibility options.
 *
 * @remarks
 * - Receives the spacer value through `value` and reports updates through `onChange`.
 * - Normalizes device visibility with visible-by-default fallbacks before rendering controls.
 * - Uses button groups for size and responsive visibility to keep Studio editing direct.
 */

import { useTranslations } from "next-intl";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM, STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SpacerCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export type SpacerCellEditorProps = Readonly<{
  idPrefix: string;
  value: SpacerCellFormValues;
  onChange: (next: SpacerCellFormValues) => void;
  disabled?: boolean;
}>;

const SIZES = ["sm", "md", "lg", "xl"] as const;
type SpacerSize = (typeof SIZES)[number];

const DEVICES = ["mobile", "tablet", "desktop"] as const;
type SpacerDevice = (typeof DEVICES)[number];

function normalizeVisibility(
  visibility: SpacerCellFormValues["visibility"] | undefined,
): NonNullable<SpacerCellFormValues["visibility"]> {
  return {
    mobile: visibility?.mobile ?? true,
    tablet: visibility?.tablet ?? true,
    desktop: visibility?.desktop ?? true,
  };
}

export function SpacerCellEditor({
  value,
  onChange,
  disabled,
}: SpacerCellEditorProps) {
  const t = useTranslations();

  const size: SpacerSize =
    value.size && SIZES.includes(value.size as SpacerSize)
      ? (value.size as SpacerSize)
      : "md";

  const visibility = normalizeVisibility(value.visibility);

  const handleToggleDevice = (device: SpacerDevice) => {
    onChange({
      ...value,
      visibility: {
        ...visibility,
        [device]: !visibility[device],
      },
    });
  };

  return (
    <div className={cn(STACK_MD)}>
      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.spacerCellEditor.sizeLabel")}
        </Text>

        <div className={cn(ROW_SM)}>
          {SIZES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={size === item ? "default" : "ghost"}
              visualMode="studio"
              disabled={disabled}
              onClick={() => {
                onChange({
                  ...value,
                  size: item,
                  visibility,
                });
              }}
            >
              {t(`studio.cellEditorTabs.spacerCellEditor.sizes.${item}`)}
            </Button>
          ))}
        </div>

        <Text as="p" variant="meta">
          {t("studio.cellEditorTabs.spacerCellEditor.sizeHelp")}
        </Text>
      </div>

      <div className={cn(STACK_SM)}>
        <Text as="p" className="font-medium">
          {t("studio.cellEditorTabs.spacerCellEditor.visibilityLabel")}
        </Text>

        <div className={cn(ROW_SM)}>
          {DEVICES.map((device) => (
            <Button
              key={device}
              type="button"
              size="sm"
              variant={visibility[device] ? "default" : "ghost"}
              visualMode="studio"
              disabled={disabled}
              onClick={() => handleToggleDevice(device)}
            >
              {t(`studio.cellEditorTabs.spacerCellEditor.devices.${device}`)}
            </Button>
          ))}
        </div>

        <Text as="p" variant="meta">
          {t("studio.cellEditorTabs.spacerCellEditor.visibilityHelp")}
        </Text>
      </div>
    </div>
  );
}

SpacerCellEditor.displayName = "SpacerCellEditor";
