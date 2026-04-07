"use client";

/**
 * @file apps/studio/src/features/builder/BuilderCellDrawer.tsx
 * @layer ui/studio/builder
 *
 * @description
 * Drawer d’édition d’une cell sélectionnée dans le builder Studio.
 *
 * @remarks
 * - Ne dépend plus de `useFormContext()`.
 * - Reçoit explicitement `control`, `setValue`, `clearErrors` et `trigger` depuis le parent.
 * - Rend un éditeur unique pour la cell active.
 * - Réutilise les éditeurs existants des cells.
 * - Le sélecteur de type reste disponible dans le drawer.
 * - Bloque la fermeture si la cell active contient des erreurs bloquantes.
 */

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type {
  Control,
  UseFormClearErrors,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import { useFormState, useWatch } from "react-hook-form";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { ButtonsCellEditor } from "@compoz/studio/features/builder/editor/cells/buttons/ButtonsCellEditor";
import { CardsExtendedCellEditor } from "@compoz/studio/features/builder/editor/cells/cards-extended/CardsExtendedCellEditor";
import { CardsCellEditor } from "@compoz/studio/features/builder/editor/cells/cards/CardsCellEditor";
import { CarouselCellEditor } from "@compoz/studio/features/builder/editor/cells/CarouselCellEditor";
import { FormCellEditor } from "@compoz/studio/features/builder/editor/cells/form/FormCellEditor";
import { GalleryCellEditor } from "@compoz/studio/features/builder/editor/cells/GalleryCellEditor";
import { HeadingCellEditor } from "@compoz/studio/features/builder/editor/cells/HeadingCellEditor";
import { ImageCellEditor } from "@compoz/studio/features/builder/editor/cells/images/ImageCellEditor";
import { RichTextCellEditor } from "@compoz/studio/features/builder/editor/cells/RichTextCellEditor";
import { SeparatorCellEditor } from "@compoz/studio/features/builder/editor/cells/SeparatorCellEditor";
import { SpacerCellEditor } from "@compoz/studio/features/builder/editor/cells/SpacerCellEditor";
import { StepsCellEditor } from "@compoz/studio/features/builder/editor/cells/steps/StepsCellEditor";
import { StructuredCardCellEditor } from "@compoz/studio/features/builder/editor/cells/structured-cards/StructuredCardCellEditor";
import { TimelineCellEditor } from "@compoz/studio/features/builder/editor/cells/timeline/TimelinesCellEditor";
import { createEmptyCell } from "@compoz/studio/features/pages/mappers/cells-form";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@compoz/ui/components/ui/drawer";
import { Separator } from "@compoz/ui/components/ui/separator";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type { CellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type BuilderCellDrawerProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  setValue: UseFormSetValue<SectionBlockFormValues>;
  clearErrors: UseFormClearErrors<SectionBlockFormValues>;
  trigger: UseFormTrigger<SectionBlockFormValues>;
  open: boolean;
  selectedCellLocation: SelectedCellLocation | null;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  onOpenChange: (open: boolean) => void;
}>;

type CellBasePath = `rows.${number}.columns.${number}.cells.${number}`;

function getCellBasePath(
  selectedCellLocation: SelectedCellLocation,
): CellBasePath {
  return `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}`;
}

export function BuilderCellDrawer({
  control,
  setValue,
  clearErrors,
  trigger,
  open,
  selectedCellLocation,
  onUploadImage,
  onOpenChange,
}: BuilderCellDrawerProps) {
  const t = useTranslations();
  const [forceShowErrors, setForceShowErrors] = useState(false);

  const { isSubmitting } = useFormState({ control });

  const watchedAll = useWatch({ control }) as
    | SectionBlockFormValues
    | undefined;

  const selectedCell = useMemo(() => {
    if (!selectedCellLocation || !watchedAll) return null;

    return (
      watchedAll.rows[selectedCellLocation.rowIndex]?.columns[
        selectedCellLocation.columnIndex
      ]?.cells[selectedCellLocation.cellIndex] ?? null
    );
  }, [selectedCellLocation, watchedAll]);

  const selectedColumn = useMemo(() => {
    if (!selectedCellLocation || !watchedAll) return null;

    return (
      watchedAll.rows[selectedCellLocation.rowIndex]?.columns[
        selectedCellLocation.columnIndex
      ] ?? null
    );
  }, [selectedCellLocation, watchedAll]);

  const canDeleteSelectedCell = Boolean(
    selectedColumn && selectedColumn.cells.length > 1,
  );

  const kindIds = createFieldIds("builder-cell-drawer", "kind");

  const setSelectedCell = (nextCell: CellFormValues) => {
    if (!selectedCellLocation || !watchedAll) return;

    const nextRows = watchedAll.rows.map((row, rowIndex) => {
      if (rowIndex !== selectedCellLocation.rowIndex) return row;

      return {
        ...row,
        columns: row.columns.map((column, columnIndex) => {
          if (columnIndex !== selectedCellLocation.columnIndex) return column;

          return {
            ...column,
            cells: column.cells.map((cell, cellIndex) => {
              if (cellIndex !== selectedCellLocation.cellIndex) return cell;
              return nextCell;
            }),
          };
        }),
      };
    });

    setValue("rows", nextRows, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  };

  const handleDeleteSelectedCell = async () => {
    if (!selectedCellLocation || !watchedAll) return;
    if (!canDeleteSelectedCell) return;

    const nextRows = watchedAll.rows.map((row, rowIndex) => {
      if (rowIndex !== selectedCellLocation.rowIndex) return row;

      return {
        ...row,
        columns: row.columns.map((column, columnIndex) => {
          if (columnIndex !== selectedCellLocation.columnIndex) return column;

          return {
            ...column,
            cells: column.cells.filter(
              (_, cellIndex) => cellIndex !== selectedCellLocation.cellIndex,
            ),
          };
        }),
      };
    });

    clearErrors(
      `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells` as const,
    );

    setValue("rows", nextRows, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });

    setForceShowErrors(false);
    onOpenChange(false);
  };

  function waitForNextFrame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  const handleDrawerOpenChange = async (nextOpen: boolean) => {
    if (nextOpen) {
      setForceShowErrors(false);
      onOpenChange(true);
      return;
    }

    if (!selectedCellLocation) {
      setForceShowErrors(false);
      onOpenChange(false);
      return;
    }

    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
      await waitForNextFrame();
    }

    const basePath = getCellBasePath(selectedCellLocation);
    const isValid = await trigger(basePath);

    if (!isValid) {
      setForceShowErrors(true);
      return;
    }

    setForceShowErrors(false);
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={handleDrawerOpenChange}
      direction="left"
      handleOnly
    >
      <DrawerContent className="mr-auto h-full! w-[80vw]! max-w-[1200px]! rounded-none border-r border-l-0 sm:max-w-[1200px]!">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-4">
            <DrawerTitle>{t("studio.builder.drawer.title")}</DrawerTitle>
            <DeleteButton
              size="icon"
              disabled={!canDeleteSelectedCell || isSubmitting}
              disabledTooltip={
                isSubmitting
                  ? t("common.actionUnavailable")
                  : t("common.delete")
              }
              onConfirmDelete={handleDeleteSelectedCell}
              ariaLabel={t("common.delete")}
              title={t("common.delete")}
            />
          </div>
        </DrawerHeader>

        <div
          className={cn("flex-1 overflow-y-auto px-4 pb-6", STACK_MD)}
          data-vaul-no-drag
        >
          {!selectedCell || !selectedCellLocation ? null : (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <SelectField
                  ids={kindIds}
                  label={t("studio.builder.drawer.kind.label")}
                  value={selectedCell.kind}
                  onChange={(value) => {
                    const nextKind = value as CellFormValues["kind"];

                    const nextCell: CellFormValues = {
                      ...createEmptyCell(nextKind),
                      id: selectedCell.id,
                    };

                    clearErrors(
                      `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as const,
                    );

                    setForceShowErrors(false);
                    setSelectedCell(nextCell);
                  }}
                  items={[
                    {
                      value: "heading",
                      label: t("studio.builder.drawer.kind.options.heading"),
                    },
                    {
                      value: "richText",
                      label: t("studio.builder.drawer.kind.options.richText"),
                    },
                    {
                      value: "spacer",
                      label: t("studio.builder.drawer.kind.options.spacer"),
                    },
                    {
                      value: "separator",
                      label: t("studio.builder.drawer.kind.options.separator"),
                    },
                    {
                      value: "buttons",
                      label: t("studio.builder.drawer.kind.options.buttons"),
                    },
                    {
                      value: "cards",
                      label: t("studio.builder.drawer.kind.options.cards"),
                    },
                    {
                      value: "cardsExtended",
                      label: t(
                        "studio.builder.drawer.kind.options.cardsExtended",
                      ),
                    },
                    {
                      value: "steps",
                      label: t("studio.builder.drawer.kind.options.steps"),
                    },
                    {
                      value: "timeline",
                      label: t("studio.builder.drawer.kind.options.timeline"),
                    },
                    {
                      value: "structuredCard",
                      label: t(
                        "studio.builder.drawer.kind.options.structuredCard",
                      ),
                    },
                    {
                      value: "form",
                      label: t("studio.builder.drawer.kind.options.form"),
                    },
                    {
                      value: "image",
                      label: t("studio.builder.drawer.kind.options.image"),
                    },
                    {
                      value: "gallery",
                      label: t("studio.builder.drawer.kind.options.gallery"),
                    },
                    {
                      value: "carousel",
                      label: t("studio.builder.drawer.kind.options.carousel"),
                    },
                  ]}
                  disabled={isSubmitting}
                  help={t("studio.builder.drawer.kind.help")}
                />
              </div>

              <Separator />

              {selectedCell.kind === "heading" ? (
                <HeadingCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "richText" ? (
                <RichTextCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                />
              ) : null}

              {selectedCell.kind === "spacer" ? (
                <SpacerCellEditor
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  value={selectedCell}
                  disabled={isSubmitting}
                  onChange={(next) => {
                    setSelectedCell(next);
                  }}
                />
              ) : null}

              {selectedCell.kind === "separator" ? (
                <SeparatorCellEditor
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  value={selectedCell}
                  disabled={isSubmitting}
                  onChange={(next) => {
                    setSelectedCell(next);
                  }}
                />
              ) : null}

              {selectedCell.kind === "buttons" ? (
                <ButtonsCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "cards" ? (
                <CardsCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "cardsExtended" ? (
                <CardsExtendedCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "steps" ? (
                <StepsCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "timeline" ? (
                <TimelineCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "structuredCard" ? (
                <StructuredCardCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                  onUploadImage={onUploadImage}
                />
              ) : null}

              {selectedCell.kind === "form" ? (
                <FormCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                />
              ) : null}

              {selectedCell.kind === "image" ? (
                <ImageCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                  onUploadImage={onUploadImage}
                />
              ) : null}

              {selectedCell.kind === "gallery" ? (
                <GalleryCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                  onUploadImage={onUploadImage}
                />
              ) : null}

              {selectedCell.kind === "carousel" ? (
                <CarouselCellEditor
                  control={control}
                  idPrefix={`builder-cell-${selectedCell.id}`}
                  selectedCellLocation={selectedCellLocation}
                  disabled={isSubmitting}
                  showError={forceShowErrors}
                  onUploadImage={onUploadImage}
                />
              ) : null}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

BuilderCellDrawer.displayName = "BuilderCellDrawer";
