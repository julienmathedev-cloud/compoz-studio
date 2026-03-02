"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/PageBlockEditHeader.tsx
 * @layer ui/organisms
 */

import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";

import { useTranslations } from "next-intl";

type TitleValue = Readonly<{ text: string; display: "visible" | "sr-only" }>;

type PageBlockEditHeaderProps = Readonly<{
  idPrefix: string;

  titleEnabled: boolean;
  title: TitleValue | null;
  columns: 1 | 2 | 3;
  disabled?: boolean;

  onTitleToggle: (enabled: boolean) => void;

  onTitleTextChange: (val: string) => void;
  onTitleTextBlur: () => void;

  onTitleDisplayChange: (val: "visible" | "sr-only") => void;

  containerMode: "contained" | "fullBleed";
  onContainerModeChange: (next: "contained" | "fullBleed") => void;

  lcpPriority: boolean;
  onLcpPriorityChange: (checked: boolean) => void;

  titleTextInvalid?: boolean;
  titleTextError?: string;

  onColumnsChange: (next: 1 | 2 | 3) => void;
}>;

export function PageBlockEditHeader({
  idPrefix,
  titleEnabled,
  title,
  columns,
  disabled = false,
  onTitleToggle,
  onTitleTextChange,
  onTitleTextBlur,
  onTitleDisplayChange,
  containerMode,
  onContainerModeChange,
  lcpPriority,
  onLcpPriorityChange,
  titleTextInvalid = false,
  titleTextError,
  onColumnsChange,
}: PageBlockEditHeaderProps) {
  const t = useTranslations();

  const titleEnabledIds = createFieldIds(idPrefix, "blockTitleEnabled");
  const titleTextIds = createFieldIds(idPrefix, "blockTitle");
  const titleDisplayIds = createFieldIds(idPrefix, "blockTitleDisplay");
  const columnsIds = createFieldIds(idPrefix, "columns");
  const containerModeIds = createFieldIds(idPrefix, "containerMode");
  const lcpPriorityIds = createFieldIds(idPrefix, "lcpPriority");

  const isFullBleed = containerMode === "fullBleed";
  const currentText = title?.text ?? "";
  const currentDisplay = title?.display ?? "visible";

  const titleFieldsDisabled = disabled || !titleEnabled;
  const canChangeDisplay = Boolean(currentText.trim());

  const columnsOptions = [
    {
      value: "1",
      label: t("admin.pageBlockEditHeader.columns.options.1"),
      textLabel: "1",
    },
    {
      value: "2",
      label: t("admin.pageBlockEditHeader.columns.options.2"),
      textLabel: "2",
    },
    {
      value: "3",
      label: t("admin.pageBlockEditHeader.columns.options.3"),
      textLabel: "3",
    },
  ] as const;

  const displayOptions = [
    {
      value: "visible",
      label: t("admin.pageBlockEditHeader.blockTitle.visible"),
      textLabel: "visible",
    },
    {
      value: "sr-only",
      label: t("admin.pageBlockEditHeader.blockTitle.srOnly"),
      textLabel: "sr-only",
    },
  ] as const;

  return (
    <div className={cn(STACK_MD)}>
      {/* ─────────────────────────────── Ligne 1 ─────────────────────────────── */}
      <div
        className={cn(
          "grid gap-4",
          // Input large / select medium / switch auto
          "md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.6fr)]",
          "md:items-start",
        )}
      >
        <InputField
          ids={titleTextIds}
          label={t("admin.pageBlockEditHeader.blockTitle.label")}
          value={currentText}
          onChange={(val) => {
            if (!titleEnabled) return;
            onTitleTextChange(val);
          }}
          onBlur={() => {
            if (!titleEnabled) return;
            onTitleTextBlur();
          }}
          placeholder={t("admin.pageBlockEditHeader.blockTitle.placeholder")}
          help={t("admin.pageBlockEditHeader.blockTitle.help")}
          disabled={titleFieldsDisabled}
          invalid={titleEnabled ? titleTextInvalid : false}
          error={titleEnabled ? titleTextError : undefined}
        />

        <SelectField
          ids={titleDisplayIds}
          label={t("admin.pageBlockEditHeader.blockTitle.displayLabel")}
          value={currentDisplay}
          onChange={(val) => {
            if (!titleEnabled) return;
            onTitleDisplayChange(val === "visible" ? "visible" : "sr-only");
          }}
          items={displayOptions}
          help={t("admin.pageBlockEditHeader.blockTitle.displayHelp")}
          disabled={titleFieldsDisabled || !canChangeDisplay}
        />

        {/* petit alignement comme tes menus : switch “posée” */}
        <div className="flex h-full justify-center items-center">
          <SwitchField
            ids={titleEnabledIds}
            label={t("admin.pageBlockEditHeader.blockTitle.switchLabel")}
            help={
              titleEnabled
                ? t("admin.pageBlockEditHeader.blockTitle.switchHelp")
                : t("admin.pageBlockEditHeader.blockTitle.none")
            }
            checked={titleEnabled}
            disabled={disabled}
            onCheckedChange={(checked) => {
              if (disabled) return;
              onTitleToggle(Boolean(checked));
            }}
          />
        </div>
      </div>

      {/* ─────────────────────────────── Ligne 2 ─────────────────────────────── */}
      <div
        className={cn(
          "grid gap-4",
          // Input large / select medium / switch auto
          "md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.6fr)]",
          "md:items-start",
        )}
      >
        <SelectField
          ids={columnsIds}
          label={t("admin.pageBlockEditHeader.columns.label")}
          value={String(columns)}
          onChange={(val) => {
            const n = Number(val);
            onColumnsChange(n === 1 ? 1 : n === 3 ? 3 : 2);
          }}
          items={columnsOptions}
          help={t("admin.pageBlockEditHeader.columns.hint")}
          disabled={disabled}
        />
        <div className="flex h-full justify-center items-center">
          <SwitchField
            ids={containerModeIds}
            label={t("admin.pageBlockEditHeader.containerMode.label")}
            help={
              isFullBleed
                ? t("admin.pageBlockEditHeader.containerMode.helpFullBleed")
                : t("admin.pageBlockEditHeader.containerMode.helpContained")
            }
            checked={isFullBleed}
            disabled={disabled}
            onCheckedChange={(checked) => {
              if (disabled) return;
              onContainerModeChange(checked ? "fullBleed" : "contained");
            }}
          />
        </div>

        <div className="flex h-full justify-center items-center">
          {/* ✅ NEW : LCP PRIORITY */}
          <SwitchField
            ids={lcpPriorityIds}
            label={t("admin.pageBlockEditHeader.lcpPriority.label")}
            help={
              lcpPriority
                ? t("admin.pageBlockEditHeader.lcpPriority.helpEnabled")
                : t("admin.pageBlockEditHeader.lcpPriority.helpDisabled")
            }
            checked={lcpPriority}
            disabled={disabled}
            onCheckedChange={(checked) => {
              if (disabled) return;
              onLcpPriorityChange(Boolean(checked));
            }}
          />
        </div>
      </div>
    </div>
  );
}

PageBlockEditHeader.displayName = "PageBlockEditHeader";
