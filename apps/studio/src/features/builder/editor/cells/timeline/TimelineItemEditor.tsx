"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/timeline/TimelineItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/timeline
 *
 * @description
 * Éditeur RHF-aware d’un item individuel pour TimelineCell.
 *
 * @remarks
 * - Connecté directement à RHF via `useController`.
 * - Reprend le pattern card utilisé par les éditeurs de listes.
 * - Le reorder est géré par drag and drop via dnd-kit.
 * - L’affichage des erreurs repose sur une règle unique :
 *   `showError || fieldState.isTouched`.
 * - La lecture/édition des valeurs passe par RHF (`useController`).
 * - `sortableId` sert uniquement au drag and drop.
 * - `watchedItem` sert de fallback visuel pour stabiliser le rendu
 *   pendant le rebinding RHF après reorder.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { TimelineItemFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type TimelineFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;
type TimelineItemBasePath = `${TimelineFieldBasePath}.items.${number}`;

export type TimelineItemEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  basePath: TimelineFieldBasePath;
  index: number;
  idPrefix: string;
  sortableId: string;
  watchedItem?: TimelineItemFormValues;
  disabled?: boolean;
  canRemove?: boolean;
  onRemove: () => void;
  showError?: boolean;
}>;

export function TimelineItemEditor({
  control,
  basePath,
  index,
  idPrefix,
  sortableId,
  watchedItem,
  disabled = false,
  canRemove = true,
  onRemove,
  showError = false,
}: TimelineItemEditorProps) {
  const t = useTranslations();

  const itemBasePath = `${basePath}.items.${index}` as TimelineItemBasePath;

  const periodCtrl = useController({
    name: `${itemBasePath}.period` as `${TimelineItemBasePath}.period`,
    control,
    defaultValue: watchedItem?.period ?? "",
  });

  const titleCtrl = useController({
    name: `${itemBasePath}.title` as `${TimelineItemBasePath}.title`,
    control,
    defaultValue: watchedItem?.title ?? "",
  });

  const subtitleCtrl = useController({
    name: `${itemBasePath}.subtitle` as `${TimelineItemBasePath}.subtitle`,
    control,
    defaultValue: watchedItem?.subtitle ?? "",
  });

  const descriptionCtrl = useController({
    name: `${itemBasePath}.description` as `${TimelineItemBasePath}.description`,
    control,
    defaultValue: watchedItem?.description ?? "",
  });

  const badgeCtrl = useController({
    name: `${itemBasePath}.badge` as `${TimelineItemBasePath}.badge`,
    control,
    defaultValue: watchedItem?.badge ?? "",
  });

  const keywordsCtrl = useController({
    name: `${itemBasePath}.keywords` as `${TimelineItemBasePath}.keywords`,
    control,
    defaultValue: watchedItem?.keywords ?? [],
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled,
  });

  const periodIds = createFieldIds(idPrefix, "period");
  const titleIds = createFieldIds(idPrefix, "title");
  const subtitleIds = createFieldIds(idPrefix, "subtitle");
  const descriptionIds = createFieldIds(idPrefix, "description");
  const badgeIds = createFieldIds(idPrefix, "badge");
  const keywordsIds = createFieldIds(idPrefix, "keywords");

  const shouldShowPeriodError = showError || periodCtrl.fieldState.isTouched;
  const shouldShowTitleError = showError || titleCtrl.fieldState.isTouched;

  const periodInvalid =
    shouldShowPeriodError && Boolean(periodCtrl.fieldState.error?.message);

  const periodError =
    shouldShowPeriodError && periodCtrl.fieldState.error?.message
      ? String(periodCtrl.fieldState.error.message)
      : undefined;

  const titleInvalid =
    shouldShowTitleError && Boolean(titleCtrl.fieldState.error?.message);

  const titleError =
    shouldShowTitleError && titleCtrl.fieldState.error?.message
      ? String(titleCtrl.fieldState.error.message)
      : undefined;

  const periodValue = String(
    periodCtrl.field.value ?? watchedItem?.period ?? "",
  );
  const badgeValue = String(badgeCtrl.field.value ?? watchedItem?.badge ?? "");
  const titleValue = String(titleCtrl.field.value ?? watchedItem?.title ?? "");
  const subtitleValue = String(
    subtitleCtrl.field.value ?? watchedItem?.subtitle ?? "",
  );
  const descriptionValue = String(
    descriptionCtrl.field.value ?? watchedItem?.description ?? "",
  );

  const keywordsArray = Array.isArray(keywordsCtrl.field.value)
    ? keywordsCtrl.field.value
    : Array.isArray(watchedItem?.keywords)
      ? watchedItem.keywords
      : [];

  const keywordsValue = keywordsArray.join("\n");

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="default"
      visualMode="studio"
      className={cn("relative h-full", STACK_MD, isDragging && "opacity-60")}
    >
      <CardContent>
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          <DragHandle
            className={cn(disabled && "pointer-events-none opacity-50")}
            disabled={disabled}
            {...attributes}
            {...listeners}
          />

          <DeleteButton
            disabled={!canRemove || disabled}
            onConfirmDelete={onRemove}
            ariaLabel={t("common.delete")}
            title={t("common.delete")}
          />
        </div>

        <FormGrid className={cn(STACK_MD, "pt-1")}>
          <InputField
            ids={periodIds}
            inputRef={periodCtrl.field.ref}
            label={t("studio.cellEditorTabs.timelineCellEditor.periodLabel")}
            value={periodValue}
            onChange={(next) => {
              periodCtrl.field.onChange(next);
            }}
            onBlur={periodCtrl.field.onBlur}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.timelineCellEditor.periodPlaceholder",
            )}
            help={t("studio.cellEditorTabs.timelineCellEditor.periodHelp")}
            invalid={periodInvalid}
            error={periodError}
          />

          <InputField
            ids={badgeIds}
            inputRef={badgeCtrl.field.ref}
            label={t("studio.cellEditorTabs.timelineCellEditor.badgeLabel")}
            value={badgeValue}
            onChange={(next) => {
              badgeCtrl.field.onChange(next);
            }}
            onBlur={badgeCtrl.field.onBlur}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.timelineCellEditor.badgePlaceholder",
            )}
            help={t("studio.cellEditorTabs.timelineCellEditor.badgeHelp")}
          />

          <InputField
            ids={titleIds}
            inputRef={titleCtrl.field.ref}
            label={t("studio.cellEditorTabs.timelineCellEditor.titleLabel")}
            value={titleValue}
            onChange={(next) => {
              titleCtrl.field.onChange(next);
            }}
            onBlur={titleCtrl.field.onBlur}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.timelineCellEditor.titlePlaceholder",
            )}
            help={t("studio.cellEditorTabs.timelineCellEditor.titleHelp")}
            invalid={titleInvalid}
            error={titleError}
          />

          <InputField
            ids={subtitleIds}
            inputRef={subtitleCtrl.field.ref}
            label={t("studio.cellEditorTabs.timelineCellEditor.subtitleLabel")}
            value={subtitleValue}
            onChange={(next) => {
              subtitleCtrl.field.onChange(next);
            }}
            onBlur={subtitleCtrl.field.onBlur}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.timelineCellEditor.subtitlePlaceholder",
            )}
            help={t("studio.cellEditorTabs.timelineCellEditor.subtitleHelp")}
          />

          <TextareaField
            ids={descriptionIds}
            label={t(
              "studio.cellEditorTabs.timelineCellEditor.descriptionLabel",
            )}
            value={descriptionValue}
            onChange={(next) => {
              descriptionCtrl.field.onChange(next);
            }}
            onBlur={descriptionCtrl.field.onBlur}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.timelineCellEditor.descriptionPlaceholder",
            )}
            help={t("studio.cellEditorTabs.timelineCellEditor.descriptionHelp")}
            rows={4}
          />

          <TextareaField
            ids={keywordsIds}
            label={t("studio.cellEditorTabs.timelineCellEditor.keywordsLabel")}
            value={keywordsValue}
            onChange={(next) => {
              keywordsCtrl.field.onChange(next.split("\n"));
            }}
            onBlur={() => {
              const rawKeywords = Array.isArray(keywordsCtrl.field.value)
                ? keywordsCtrl.field.value
                : [];

              const normalizedKeywords = rawKeywords
                .map((keyword) => String(keyword).trim())
                .filter((keyword) => keyword.length > 0);

              keywordsCtrl.field.onChange(normalizedKeywords);
              keywordsCtrl.field.onBlur();
            }}
            disabled={disabled}
            placeholder={t(
              "studio.cellEditorTabs.timelineCellEditor.keywordsPlaceholder",
            )}
            help={t("studio.cellEditorTabs.timelineCellEditor.keywordsHelp")}
            rows={4}
          />
        </FormGrid>
      </CardContent>
    </Card>
  );
}

TimelineItemEditor.displayName = "TimelineItemEditor";
