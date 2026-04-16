"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/RichTextCellEditor.tsx
 * @layer ui/studio/pages/blocks/editor
 *
 * @description
 * Wrapper RHF-aware pour une cellule `richText`.
 *
 * @remarks
 * - Récupère la valeur HTML et le booléen `reveal` depuis le formulaire RHF.
 * - Délègue l’édition du contenu au composant UI pur `RichTextContentEditor`.
 * - Suit le même pattern que `HeadingCellEditor` : logique formulaire ici, UI riche dans un sous-composant.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { RichTextContentEditor } from "@compoz/studio/features/builder/editor/cells/RichTextContentEditor";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

export type RichTextCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
}>;

type RichTextFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;

export function RichTextCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
}: RichTextCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as RichTextFieldBasePath;

  const contentCtrl = useController({
    name: `${basePath}.content` as `${RichTextFieldBasePath}.content`,
    control,
  });

  const revealCtrl = useController({
    name: `${basePath}.reveal` as `${RichTextFieldBasePath}.reveal`,
    control,
  });

  const revealIds = createFieldIds(idPrefix, "reveal");

  return (
    <div className={cn(STACK_MD)}>
      <SwitchField
        ids={revealIds}
        label={t("studio.cellEditorTabs.richText.revealLabel")}
        checked={
          typeof revealCtrl.field.value === "boolean"
            ? revealCtrl.field.value
            : false
        }
        onCheckedChange={revealCtrl.field.onChange}
        disabled={disabled}
        help={t("studio.cellEditorTabs.richText.revealHelp")}
      />

      <RichTextContentEditor
        value={String(contentCtrl.field.value ?? "")}
        onChange={contentCtrl.field.onChange}
        disabled={disabled}
      />
    </div>
  );
}

RichTextCellEditor.displayName = "RichTextCellEditor";
