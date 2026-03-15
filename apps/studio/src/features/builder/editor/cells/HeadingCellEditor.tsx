"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/HeadingCellEditor.tsx
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { Button } from "@compoz/ui/components/ui/button";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

export type HeadingCellEditorProps = Readonly<{
  control: Control<SectionBlockFormValues>;
  idPrefix: string;
  selectedCellLocation: SelectedCellLocation;
  disabled?: boolean;
  showError?: boolean;
}>;

const LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const ALIGNS = ["left", "center"] as const;
const VARIANTS = ["default", "hero"] as const;

type HeadingLevel = (typeof LEVELS)[number];
type HeadingAlign = (typeof ALIGNS)[number];
type HeadingVariant = (typeof VARIANTS)[number];

type HeadingFieldBasePath = `rows.${number}.columns.${number}.cells.${number}`;

export function HeadingCellEditor({
  control,
  idPrefix,
  selectedCellLocation,
  disabled,
  showError = false,
}: HeadingCellEditorProps) {
  const t = useTranslations();

  const basePath =
    `rows.${selectedCellLocation.rowIndex}.columns.${selectedCellLocation.columnIndex}.cells.${selectedCellLocation.cellIndex}` as HeadingFieldBasePath;

  const levelCtrl = useController({
    name: `${basePath}.level` as `${HeadingFieldBasePath}.level`,
    control,
  });

  const titleCtrl = useController({
    name: `${basePath}.title` as `${HeadingFieldBasePath}.title`,
    control,
  });

  const subtitleCtrl = useController({
    name: `${basePath}.subtitle` as `${HeadingFieldBasePath}.subtitle`,
    control,
  });

  const alignCtrl = useController({
    name: `${basePath}.align` as `${HeadingFieldBasePath}.align`,
    control,
  });

  const variantCtrl = useController({
    name: `${basePath}.variant` as `${HeadingFieldBasePath}.variant`,
    control,
  });

  const separatorCtrl = useController({
    name: `${basePath}.separator` as `${HeadingFieldBasePath}.separator`,
    control,
  });

  const revealCtrl = useController({
    name: `${basePath}.reveal` as `${HeadingFieldBasePath}.reveal`,
    control,
  });

  const highlightsCtrl = useController({
    name: `${basePath}.highlights` as `${HeadingFieldBasePath}.highlights`,
    control,
  });

  const idAnchorCtrl = useController({
    name: `${basePath}.idAnchor` as `${HeadingFieldBasePath}.idAnchor`,
    control,
  });

  const levelIds = createFieldIds(idPrefix, "level");
  const titleIds = createFieldIds(idPrefix, "title");
  const subtitleIds = createFieldIds(idPrefix, "subtitle");
  const highlightsIds = createFieldIds(idPrefix, "highlights");
  const idAnchorIds = createFieldIds(idPrefix, "idAnchor");
  const separatorIds = createFieldIds(idPrefix, "separator");
  const revealIds = createFieldIds(idPrefix, "reveal");

  const level: HeadingLevel =
    levelCtrl.field.value &&
    LEVELS.includes(levelCtrl.field.value as HeadingLevel)
      ? (levelCtrl.field.value as HeadingLevel)
      : "h2";

  const align: HeadingAlign =
    alignCtrl.field.value &&
    ALIGNS.includes(alignCtrl.field.value as HeadingAlign)
      ? (alignCtrl.field.value as HeadingAlign)
      : "left";

  const variant: HeadingVariant =
    variantCtrl.field.value &&
    VARIANTS.includes(variantCtrl.field.value as HeadingVariant)
      ? (variantCtrl.field.value as HeadingVariant)
      : "default";

  const highlightsValue = useMemo(
    () =>
      serializeHighlights(
        Array.isArray(highlightsCtrl.field.value)
          ? (highlightsCtrl.field.value as readonly string[])
          : undefined,
      ),
    [highlightsCtrl.field.value],
  );

  const titleInvalid =
    (showError || titleCtrl.fieldState.isTouched) &&
    Boolean(titleCtrl.fieldState.error?.message);

  const titleError =
    (showError || titleCtrl.fieldState.isTouched) &&
    titleCtrl.fieldState.error?.message
      ? String(titleCtrl.fieldState.error.message)
      : undefined;

  const idAnchorInvalid =
    (showError || idAnchorCtrl.fieldState.isTouched) &&
    Boolean(idAnchorCtrl.fieldState.error?.message);

  const idAnchorError =
    (showError || idAnchorCtrl.fieldState.isTouched) &&
    idAnchorCtrl.fieldState.error?.message
      ? String(idAnchorCtrl.fieldState.error.message)
      : undefined;

  return (
    <div className={cn(STACK_MD)}>
      <div className="grid grid-cols-[minmax(110px,25%)_1fr] gap-3">
        <SelectField
          ids={levelIds}
          label={t("studio.cellEditorTabs.headingCellEditor.levelLabel")}
          value={level}
          onChange={(next) => {
            levelCtrl.field.onChange(next as HeadingLevel);
          }}
          items={LEVELS.map((item) => ({
            value: item,
            label: item.toUpperCase(),
          }))}
          disabled={disabled}
          help={t("studio.cellEditorTabs.headingCellEditor.levelHelp")}
        />

        <InputField
          ids={titleIds}
          inputRef={titleCtrl.field.ref}
          label={t("studio.cellEditorTabs.headingCellEditor.titleLabel")}
          value={String(titleCtrl.field.value ?? "")}
          onChange={titleCtrl.field.onChange}
          onBlur={titleCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.headingCellEditor.titlePlaceholder",
          )}
          disabled={disabled}
          help={t("studio.cellEditorTabs.headingCellEditor.titleHelp")}
          invalid={titleInvalid}
          error={titleError}
        />
      </div>

      <TextareaField
        ids={subtitleIds}
        label={t("studio.cellEditorTabs.headingCellEditor.subtitleLabel")}
        value={String(subtitleCtrl.field.value ?? "")}
        onChange={subtitleCtrl.field.onChange}
        onBlur={subtitleCtrl.field.onBlur}
        placeholder={t(
          "studio.cellEditorTabs.headingCellEditor.subtitlePlaceholder",
        )}
        disabled={disabled}
        rows={3}
        help={t("studio.cellEditorTabs.headingCellEditor.subtitleHelp")}
      />

      <FormGrid>
        <InputField
          ids={highlightsIds}
          label={t("studio.cellEditorTabs.headingCellEditor.highlightsLabel")}
          value={highlightsValue}
          onChange={(next) => {
            highlightsCtrl.field.onChange(parseHighlights(next));
          }}
          onBlur={highlightsCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.headingCellEditor.highlightsPlaceholder",
          )}
          disabled={disabled}
          help={t("studio.cellEditorTabs.headingCellEditor.highlightsHelp")}
        />

        <InputField
          ids={idAnchorIds}
          inputRef={idAnchorCtrl.field.ref}
          label={t("studio.cellEditorTabs.headingCellEditor.idAnchorLabel")}
          value={String(idAnchorCtrl.field.value ?? "")}
          onChange={idAnchorCtrl.field.onChange}
          onBlur={idAnchorCtrl.field.onBlur}
          placeholder={t(
            "studio.cellEditorTabs.headingCellEditor.idAnchorPlaceholder",
          )}
          disabled={disabled}
          help={t("studio.cellEditorTabs.headingCellEditor.idAnchorHelp")}
          invalid={idAnchorInvalid}
          error={idAnchorError}
        />
      </FormGrid>

      <div className="grid grid-cols-2 items-start gap-2 space-y-4 lg:grid-cols-4 lg:gap-4">
        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.headingCellEditor.alignLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {ALIGNS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={align === item ? "default" : "ghost"}
                onClick={() => alignCtrl.field.onChange(item)}
                disabled={disabled}
              >
                {t(`studio.cellEditorTabs.headingCellEditor.aligns.${item}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn(STACK_SM)}>
          <Text as="p" className="font-medium">
            {t("studio.cellEditorTabs.headingCellEditor.variantLabel")}
          </Text>

          <div className="flex items-center gap-0.5">
            {VARIANTS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={variant === item ? "default" : "ghost"}
                onClick={() => variantCtrl.field.onChange(item)}
                disabled={disabled}
              >
                {t(`studio.cellEditorTabs.headingCellEditor.variants.${item}`)}
              </Button>
            ))}
          </div>
        </div>

        <SwitchField
          ids={separatorIds}
          label={t("studio.cellEditorTabs.headingCellEditor.separatorLabel")}
          checked={Boolean(separatorCtrl.field.value)}
          onCheckedChange={separatorCtrl.field.onChange}
          disabled={disabled}
          help={t("studio.cellEditorTabs.headingCellEditor.separatorHelp")}
        />

        <SwitchField
          ids={revealIds}
          label={t("studio.cellEditorTabs.headingCellEditor.revealLabel")}
          checked={
            typeof revealCtrl.field.value === "boolean"
              ? revealCtrl.field.value
              : true
          }
          onCheckedChange={revealCtrl.field.onChange}
          disabled={disabled}
          help={t("studio.cellEditorTabs.headingCellEditor.revealHelp")}
        />
      </div>
    </div>
  );
}

HeadingCellEditor.displayName = "HeadingCellEditor";

function parseHighlights(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeHighlights(
  highlights: readonly string[] | undefined,
): string {
  if (!highlights?.length) return "";
  return highlights.join(", ");
}
