"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/timeline/TimelinesCellEditor.tsx
 * @layer studio/features/builder/editor/cells/timeline
 *
 * @description
 * RHF-aware TimelineCell editor for collapsible behavior and timeline item editing.
 *
 * @remarks
 * - Binds the collapsible control directly through RHF `useController`.
 * - Manages items through `useFieldArray` so values, errors, and reordering stay consistent.
 * - Uses `move()` to preserve RHF state while reordering.
 * - Reads live item values through `useWatch` and delegates item rendering to `TimelineListEditor`.
 */

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController, useFieldArray, useWatch } from "react-hook-form";

import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { TimelineListEditor } from "@compoz/studio/features/builder/editor/cells/timeline/TimelineListEditor";
import { createEmptyTimelineItem } from "@compoz/studio/features/pages/mappers/cells-form";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { TimelineItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

type TimelineFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type TimelineItemsPath = `${TimelineFieldBasePath}.items`;

type TimelineItemField = TimelineItemFormValues & { fieldId: string };

export type TimelineCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

export function TimelineCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: TimelineCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as TimelineFieldBasePath;

  const itemsPath = `${basePath}.items` as TimelineItemsPath;

  const collapsibleCtrl = useController({
    name: `${basePath}.collapsible` as `${TimelineFieldBasePath}.collapsible`,
    control,
    defaultValue: true,
  });

  /**
   * `useFieldArray` is the RHF source of truth for timeline items.
   *
   * `keyName: "fieldId"` avoids colliding with the domain `id` already present
   * in `TimelineItemFormValues`.
   */
  const { fields, append, remove, move } = useFieldArray<
    SectionBlockFormValues,
    TimelineItemsPath,
    "fieldId"
  >({
    control,
    name: itemsPath,
    keyName: "fieldId",
  });

  const watchedItems = (useWatch({
    control,
    name: itemsPath,
  }) ?? []) as TimelineItemFormValues[];

  const timelineFields = fields as TimelineItemField[];
  const collapsibleIds = createFieldIds(idPrefix, "collapsible");

  return (
    <div className={cn(STACK_MD)}>
      <SwitchField
        ids={collapsibleIds}
        label={t("studio.cellEditorTabs.timelineCellEditor.collapsibleLabel")}
        help={t("studio.cellEditorTabs.timelineCellEditor.collapsibleHelp")}
        checked={Boolean(collapsibleCtrl.field.value)}
        disabled={disabled}
        onCheckedChange={(checked) => {
          collapsibleCtrl.field.onChange(checked);
        }}
      />
      <div>
        <p className="text-sm font-medium">
          {t("studio.cellEditorTabs.timelineCellEditor.itemsLabel")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t("studio.cellEditorTabs.timelineCellEditor.itemsHelp")}
        </p>
      </div>

      <TimelineListEditor
        control={control}
        idPrefix={idPrefix}
        basePath={basePath}
        fields={timelineFields}
        watchedItems={watchedItems}
        append={append}
        remove={remove}
        move={move}
        disabled={disabled}
        createEmptyItem={createEmptyTimelineItem}
        minItems={1}
        showError={showError}
      />
    </div>
  );
}

TimelineCellEditor.displayName = "TimelineCellEditor";
