"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemeForm.tsx
 * @layer studio/features/settings/theme
 *
 * @description
 * RHF and Zod-backed studio form for editing public theme settings.
 *
 * @remarks
 * - Reports UI warnings, blocking error count, value changes, dirty state, and the active warning mode to the parent section.
 * - Theme token warnings are scoped to the currently selected light or dark token tab.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useWatch } from "react-hook-form";

import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { ColorPickerField } from "@compoz/studio/components/molecules/fields/ColorPickerField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { useSettingsSectionForm } from "@compoz/studio/features/settings/_shared/useSettingsSectionForm";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { ThemeFontSelectField } from "@compoz/studio/features/settings/theme/ThemeFontSelectField";
import type { ThemeWarningKey } from "@compoz/studio/features/settings/theme/validate";
import { useThemeUiWarnings } from "@compoz/studio/features/settings/theme/validate";

import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@compoz/ui/components/ui/tabs";

import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";

import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";

import {
  ThemeFormSchema,
  type ThemeFormValues,
} from "@compoz/validation/site/settings/theme/theme-form";

type ThemeFormProps = Readonly<{
  initialValues: ThemeFormValues;
  isSaving?: boolean;
  onSubmit: (values: ThemeFormValues) => void | Promise<void>;
  onReset?: () => void;
  onValuesChange?: (values: ThemeFormValues) => void;
  onWarningKeysChange?: (keys: ThemeWarningKey[]) => void;
  onActiveWarningModeChange?: (mode: "light" | "dark") => void;
  onBlockingErrorsCountChange?: (count: number) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

const MODE_ITEMS = ["light", "dark", "system"] as const;
const REVEAL_ITEMS = ["fade", "fade-up", "scale-in", "slide-up"] as const;

const BASIC_THEME_TOKEN_KEYS = [
  "background",
  "foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
] as const;

const ADVANCED_THEME_TOKEN_KEYS = [
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "muted",
  "muted-foreground",
  "chrome",
  "border",
  "input",
  "ring",
] as const;

const THEME_TOKEN_KEYS = [
  ...BASIC_THEME_TOKEN_KEYS,
  ...ADVANCED_THEME_TOKEN_KEYS,
] as const;

type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

export function ThemeForm({
  initialValues,
  isSaving,
  onSubmit,
  onReset,
  onValuesChange,
  onWarningKeysChange,
  onActiveWarningModeChange,
  onBlockingErrorsCountChange,
  onDirtyChange,
}: ThemeFormProps) {
  const t = useTranslations();

  const {
    control,
    handleSubmit,
    resetToInitialValues,
    isDirty,
    isSubmitting,
    isBusy,
    disabledControls,
    errors,
  } = useSettingsSectionForm<ThemeFormValues>({
    resolver: zodResolver(ThemeFormSchema),
    initialValues,
    isSaving,
    onValuesChange,
    onDirtyChange,
  });

  const idPrefix = useIdPrefix("theme-form");
  const [tokensTab, setTokensTab] = useState<"light" | "dark">("light");

  const enableDarkModeIds = createFieldIds(idPrefix, "enableDarkMode");
  const fontFamilyIds = createFieldIds(idPrefix, "fontFamily");
  const headingFontIds = createFieldIds(idPrefix, "headingFont");

  const enableDarkMode = useWatch({
    control,
    name: "enableDarkMode",
  });

  const lightTokens = useWatch({
    control,
    name: "lightTokens",
  });

  const darkTokens = useWatch({
    control,
    name: "darkTokens",
  });

  const warningValues = useMemo<
    Pick<ThemeFormValues, "lightTokens" | "darkTokens">
  >(
    () => ({
      lightTokens: lightTokens ?? initialValues.lightTokens,
      darkTokens: darkTokens ?? initialValues.darkTokens,
    }),
    [
      lightTokens,
      darkTokens,
      initialValues.lightTokens,
      initialValues.darkTokens,
    ],
  );

  const warningKeys = useThemeUiWarnings(warningValues, tokensTab);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  useEffect(() => {
    onActiveWarningModeChange?.(tokensTab);
  }, [tokensTab, onActiveWarningModeChange]);

  const blockingErrorsCount = useMemo(() => {
    let count = 0;

    if (errors.fontFamily) count++;
    if (errors.headingFont) count++;

    for (const key of THEME_TOKEN_KEYS) {
      if (errors.lightTokens?.[key]) count++;
      if (errors.darkTokens?.[key]) count++;
    }

    return count;
  }, [errors]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  const toBool = (v: boolean | "indeterminate") => v === true;

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent className={cn(STACK_MD)}>
          <div className={cn(STACK_SM)}>
            <FormGrid>
              <Controller
                name="fontFamily"
                control={control}
                render={({ field }) => (
                  <ThemeFontSelectField
                    ids={fontFamilyIds}
                    name={field.name}
                    label={t("studio.themeForm.fontFamily.label")}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    placeholder={t("studio.themeForm.fontFamily.placeholder")}
                    help={t("studio.themeForm.fontFamily.help")}
                    disabled={disabledControls}
                    invalid={Boolean(errors.fontFamily?.message)}
                    error={
                      errors.fontFamily?.message
                        ? String(errors.fontFamily.message)
                        : undefined
                    }
                  />
                )}
              />

              <Controller
                name="headingFont"
                control={control}
                render={({ field }) => (
                  <ThemeFontSelectField
                    ids={headingFontIds}
                    name={field.name}
                    label={t("studio.themeForm.headingFont.label")}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    fallbackLabel={t("studio.themeForm.headingFont.sameAsBody")}
                    help={t("studio.themeForm.headingFont.help")}
                    disabled={disabledControls}
                    invalid={Boolean(errors.headingFont?.message)}
                    error={
                      errors.headingFont?.message
                        ? String(errors.headingFont.message)
                        : undefined
                    }
                  />
                )}
              />

              <Controller
                name="enableDarkMode"
                control={control}
                render={({ field }) => (
                  // Dark mode editing is prepared in the schema but disabled until the public theme supports it.
                  <SwitchField
                    ids={enableDarkModeIds}
                    name={field.name}
                    label={t("studio.themeForm.enableDarkMode.label")}
                    help={t("common.availableInNextVersion")}
                    checked={false}
                    onCheckedChange={(v) => field.onChange(toBool(v))}
                    disabled={disabledControls}
                  />
                )}
              />

              <Controller
                name="revealPreset"
                control={control}
                render={({ field }) => (
                  <div className={cn(STACK_SM)}>
                    <p className="text-sm font-medium">
                      {t("studio.themeForm.revealPreset.label")}
                    </p>

                    <div className="flex flex-wrap items-center gap-0.5">
                      {REVEAL_ITEMS.map((item) => (
                        <Button
                          key={item}
                          type="button"
                          size="sm"
                          variant={field.value === item ? "default" : "ghost"}
                          visualMode="studio"
                          onClick={() => field.onChange(item)}
                          disabled={disabledControls}
                        >
                          {t(`studio.themeForm.revealPreset.items.${item}`)}
                        </Button>
                      ))}
                    </div>

                    <p className="text-muted-foreground text-xs">
                      {t("studio.themeForm.revealPreset.help")}
                    </p>
                  </div>
                )}
              />

              <Controller
                name="mode"
                control={control}
                render={({ field }) => (
                  <div className={cn(STACK_SM)}>
                    <p className="text-sm font-medium">
                      {t("studio.themeForm.mode.label")}
                    </p>

                    <div className="flex flex-wrap items-center gap-0.5">
                      {MODE_ITEMS.map((item) => (
                        // Theme mode selection is reserved until dark/system rendering is enabled publicly.
                        <Button
                          key={item}
                          type="button"
                          size="sm"
                          variant={field.value === item ? "default" : "ghost"}
                          visualMode="studio"
                          onClick={() => field.onChange(item)}
                          disabled={true}
                        >
                          {t(`studio.themeForm.mode.items.${item}`)}
                        </Button>
                      ))}
                    </div>

                    <p className="text-muted-foreground text-xs">
                      {t("common.availableInNextVersion")}
                    </p>
                  </div>
                )}
              />
            </FormGrid>
          </div>

          <Separator />

          <div className={cn(STACK_SM)}>
            <Tabs
              value={tokensTab}
              onValueChange={(v) => {
                if (v === "light" || v === "dark") setTokensTab(v);
              }}
              className={cn(STACK_SM)}
            >
              <TabsList className="mx-auto">
                <TabsTrigger value="light">
                  {t("studio.themeForm.lightTokens.title")}
                </TabsTrigger>

                <TabsTrigger value="dark" disabled={!enableDarkMode}>
                  {t("studio.themeForm.darkTokens.title")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="light" className="mb-0!">
                <ThemeTokensSection
                  prefix={`${idPrefix}-light`}
                  groupName="lightTokens"
                  tokenKeys={BASIC_THEME_TOKEN_KEYS}
                  control={control}
                  disabled={disabledControls}
                  errors={errors.lightTokens}
                />

                <ExpandableLayout>
                  <ThemeTokensSection
                    prefix={`${idPrefix}-light-advanced`}
                    groupName="lightTokens"
                    tokenKeys={ADVANCED_THEME_TOKEN_KEYS}
                    control={control}
                    disabled={disabledControls}
                    errors={errors.lightTokens}
                  />
                </ExpandableLayout>
              </TabsContent>

              <TabsContent value="dark" className="mb-0!">
                <ThemeTokensSection
                  prefix={`${idPrefix}-dark`}
                  groupName="darkTokens"
                  tokenKeys={BASIC_THEME_TOKEN_KEYS}
                  control={control}
                  disabled={disabledControls || !enableDarkMode}
                  errors={errors.darkTokens}
                />

                <ExpandableLayout>
                  <ThemeTokensSection
                    prefix={`${idPrefix}-dark-advanced`}
                    groupName="darkTokens"
                    tokenKeys={ADVANCED_THEME_TOKEN_KEYS}
                    control={control}
                    disabled={disabledControls || !enableDarkMode}
                    errors={errors.darkTokens}
                  />
                </ExpandableLayout>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>

        <CardFooter>
          <ActionsBar
            variant="resetSubmit"
            isSaving={isSaving || isSubmitting}
            isDirty={isDirty}
            onReset={() => {
              resetToInitialValues();
              onReset?.();
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

ThemeForm.displayName = "ThemeForm";

type ThemeTokensSectionProps = Readonly<{
  prefix: string;
  groupName: "lightTokens" | "darkTokens";
  tokenKeys: readonly ThemeTokenKey[];
  control: ReturnType<
    typeof useSettingsSectionForm<ThemeFormValues>
  >["control"];
  disabled: boolean;
  errors: Partial<Record<ThemeTokenKey, { message?: string }>> | undefined;
}>;

function ThemeTokensSection({
  prefix,
  groupName,
  tokenKeys,
  control,
  disabled,
  errors,
}: ThemeTokensSectionProps) {
  const t = useTranslations();

  return (
    <FormGrid>
      {tokenKeys.map((tokenKey) => {
        const ids = createFieldIds(prefix, tokenKey);

        return (
          <Controller
            key={`${groupName}.${tokenKey}`}
            name={`${groupName}.${tokenKey}`}
            control={control}
            render={({ field }) => (
              <ColorPickerField
                ids={ids}
                name={field.name}
                label={t(`studio.themeForm.tokens.labels.${tokenKey}`)}
                value={field.value ?? ""}
                onChange={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                placeholder={t(
                  `studio.themeForm.tokens.placeholders.${tokenKey}`,
                )}
                help={t(`studio.themeForm.tokens.help.${tokenKey}`)}
                disabled={disabled}
                invalid={Boolean(errors?.[tokenKey]?.message)}
                error={
                  errors?.[tokenKey]?.message
                    ? String(errors[tokenKey]?.message)
                    : undefined
                }
                className="min-w-0"
              />
            )}
          />
        );
      })}
    </FormGrid>
  );
}
