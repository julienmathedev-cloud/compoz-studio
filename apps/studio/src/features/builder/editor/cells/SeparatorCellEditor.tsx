"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/SeparatorCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor/cells
 *
 * @description
 * Éditeur UI d’une SeparatorCell avec gestion de l’alignement
 * et de la taille.
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
  idPrefix,
  value,
  onChange,
  disabled,
}: SeparatorCellEditorProps) {
  const t = useTranslations();

  const alignIds = createFieldIds(idPrefix, "align");
  const sizeIds = createFieldIds(idPrefix, "size");

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
      <SelectField
        ids={alignIds}
        label={t("studio.cellEditorTabs.separatorCellEditor.alignLabel")}
        value={align}
        onChange={(next) => {
          onChange({
            ...value,
            align: next as SeparatorAlign,
          });
        }}
        items={ALIGNS.map((item) => ({
          value: item,
          label: t(`studio.cellEditorTabs.separatorCellEditor.aligns.${item}`),
        }))}
        disabled={disabled}
        help={t("studio.cellEditorTabs.separatorCellEditor.alignHelp")}
      />

      <SelectField
        ids={sizeIds}
        label={t("studio.cellEditorTabs.separatorCellEditor.sizeLabel")}
        value={size}
        onChange={(next) => {
          onChange({
            ...value,
            size: next as SeparatorSize,
          });
        }}
        items={SIZES.map((item) => ({
          value: item,
          label: t(`studio.cellEditorTabs.separatorCellEditor.sizes.${item}`),
        }))}
        disabled={disabled}
        help={t("studio.cellEditorTabs.separatorCellEditor.sizeHelp")}
      />
    </div>
  );
}

SeparatorCellEditor.displayName = "SeparatorCellEditor";
