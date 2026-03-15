"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/SpacerCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur UI d’une SpacerCell avec sélection de la taille.
 *
 * @remarks
 * - UI-only : aucune logique métier.
 * - Modèle contrôlé (value/onChange).
 * - Réutilise `SelectField` pour rester homogène avec le Studio.
 */

import { useTranslations } from "next-intl";

import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
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
  idPrefix,
  value,
  onChange,
  disabled,
}: SpacerCellEditorProps) {
  const t = useTranslations();

  const sizeIds = createFieldIds(idPrefix, "size");

  const size: SpacerSize =
    value.size && SIZES.includes(value.size as SpacerSize)
      ? (value.size as SpacerSize)
      : "md";

  return (
    <div className={cn(STACK_MD)}>
      <SelectField
        ids={sizeIds}
        label={t("studio.cellEditorTabs.spacerCellEditor.sizeLabel")}
        value={size}
        onChange={(next) => {
          onChange({
            ...value,
            size: next as SpacerSize,
          });
        }}
        items={SIZES.map((item) => ({
          value: item,
          label: t(`studio.cellEditorTabs.spacerCellEditor.sizes.${item}`),
        }))}
        disabled={disabled}
        help={t("studio.cellEditorTabs.spacerCellEditor.sizeHelp")}
      />
    </div>
  );
}

SpacerCellEditor.displayName = "SpacerCellEditor";
