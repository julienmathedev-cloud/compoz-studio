"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/SpacerCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur UI d’une SpacerCell avec sélection directe de la taille.
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Modèle contrôlé (value/onChange).
 * - Utilise des boutons plutôt qu’un select pour une sélection plus directe
 *   et cohérente avec les autres editors Studio.
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
              variant={size === item ? "defaultStudio" : "ghostStudio"}
              disabled={disabled}
              onClick={() => {
                onChange({
                  ...value,
                  size: item,
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
    </div>
  );
}

SpacerCellEditor.displayName = "SpacerCellEditor";
