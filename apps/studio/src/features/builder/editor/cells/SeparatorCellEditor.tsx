"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/SeparatorCellEditor.tsx
 * @layer studio/features/builder/editor/cells
 *
 * @description
 * Controlled SeparatorCell editor for align and size options.
 *
 * @remarks
 * - Receives the separator value through `value` and reports updates through `onChange`.
 * - Normalizes align and size values with safe fallbacks before rendering controls.
 * - Uses button groups instead of selects for direct Studio editing.
 */

import { useTranslations } from "next-intl";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM, STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SeparatorCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export type SeparatorCellEditorProps = Readonly<{
  idPrefix: string;
  value: SeparatorCellFormValues;
  onChange: (next: SeparatorCellFormValues) => void;
  disabled?: boolean;
}>;

const ALIGNS = ["left", "center", "right", "full"] as const;
const SIZES = ["sm", "md", "lg"] as const;

type SeparatorAlign = (typeof ALIGNS)[number];
type SeparatorSize = (typeof SIZES)[number];

export function SeparatorCellEditor({
  value,
  onChange,
  disabled,
}: SeparatorCellEditorProps) {
  const t = useTranslations();

  const align: SeparatorAlign =
    value.align && ALIGNS.includes(value.align as SeparatorAlign)
      ? (value.align as SeparatorAlign)
      : "center";

  const size: SeparatorSize =
    value.size && SIZES.includes(value.size as SeparatorSize)
      ? (value.size as SeparatorSize)
      : "md";

  return (
    <div className={cn(STACK_MD)}>
      <FormGrid>
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.separatorCellEditor.alignLabel")}
          </Text>

          <div className={cn(ROW_SM, "flex-wrap")}>
            {ALIGNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={align === item ? "default" : "ghost"}
                visualMode="studio"
                disabled={disabled}
                onClick={() => {
                  onChange({
                    ...value,
                    align: item,
                  });
                }}
              >
                {t(`studio.cellEditorTabs.separatorCellEditor.aligns.${item}`)}
              </Button>
            ))}
          </div>

          <Text as="p" variant="meta">
            {t("studio.cellEditorTabs.separatorCellEditor.alignHelp")}
          </Text>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.separatorCellEditor.sizeLabel")}
          </Text>

          <div className={cn(ROW_SM, "flex-wrap")}>
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
                  });
                }}
              >
                {t(`studio.cellEditorTabs.separatorCellEditor.sizes.${item}`)}
              </Button>
            ))}
          </div>

          <Text as="p" variant="meta">
            {t("studio.cellEditorTabs.separatorCellEditor.sizeHelp")}
          </Text>
        </div>
      </FormGrid>
    </div>
  );
}

SeparatorCellEditor.displayName = "SeparatorCellEditor";
