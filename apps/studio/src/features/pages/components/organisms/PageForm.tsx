"use client";

/**
 * @file apps/studio/src/features/pages/components/organisms/PageForm.tsx
 * @layer studio/features/pages/components/organisms
 *
 * @description
 * RHF and Zod page form for page title, slug, parent, sitemap, pagination, and SEO settings.
 *
 * @remarks
 * - Receives `initialValues` from the parent and submits Zod-validated `PageFormValues`.
 * - Derives non-blocking UI warnings from RHF values and reports them to the parent.
 * - Shows blocking errors near the affected fields.
 * - Auto-syncs the slug from the page name until the user manually edits the slug.
 * - Focuses the first invalid field on submit through stable field ids.
 * - Forces root pages to keep pagination disabled.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";
import { Controller, useForm, useFormState, useWatch } from "react-hook-form";

import {
  PAGE_NAME,
  PAGE_SEO_DESCRIPTION,
  PAGE_SEO_TITLE,
} from "@compoz/core/constants/limits/pages";
import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { SLUG_FINAL_RE } from "@compoz/core/domain/slug/constants";
import { normalizeSlug } from "@compoz/core/domain/slug/utils";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { PageMetadataConflictPanel } from "@compoz/studio/features/pages/components/molecules/PageMetadataConflictPanel";
import {
  hasUnresolvedPageMetadataConflicts,
  type PageMetadataConflictChoice,
  type PageMetadataConflictResolution,
  type PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type {
  PageFormDirtyFields,
  PageFormSubmissionResult,
} from "@compoz/studio/features/pages/mappers/pages-form";
import {
  createSlugAutoSyncState,
  getAutoSlugFromName,
  type SlugAutoSyncState,
} from "@compoz/studio/features/pages/lib/page-slug-auto-sync";
import { applyPageFormParentRebase } from "@compoz/studio/features/pages/lib/page-form-parent-rebase";
import {
  usePageUiWarnings,
  type PageWarningKey,
} from "@compoz/studio/features/pages/validation/validate";
import { useStableWarningKeys } from "@compoz/studio/features/settings/_shared/useStableWarningKeys";
import { notify } from "@compoz/studio/lib/ui/notify";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { focusByFieldId } from "@compoz/ui/lib/focus";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import {
  PageFormSchema,
  type PageFormValues,
} from "@compoz/validation/pages/page-form";

type ParentOption = Readonly<{
  value: string;
  label: string;
}>;

/**
 * Props du composant `PageForm`.
 */
type PageFormProps = Readonly<{
  initialValues: PageFormValues;
  isSaving?: boolean;
  parentOptions?: ReadonlyArray<ParentOption>;
  mode?: "create" | "edit";
  bFocusFields?: boolean;
  bCancelAlwaysEnabledInEdit?: boolean;
  onSubmit: (
    values: PageFormValues,
    dirtyFields: PageFormDirtyFields,
  ) => PageFormSubmissionResult | Promise<PageFormSubmissionResult>;
  onReset?: (resetValues: PageFormValues) => void;
  metadataConflict?: PageMetadataConflictState | null;
  onMetadataConflictChoice?: (
    field: PageMetadataConflictState["unresolvedFields"][number],
    choice: PageMetadataConflictChoice,
    localValues: PageFormValues,
  ) => PageMetadataConflictResolution;
  onWarningKeysChange?: (keys: PageWarningKey[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onBlockingErrorsCountChange?: (count: number) => void;
}>;

const NO_PARENT_VALUE = "__none__";
const CHANGEFREQ_VALUES = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const;

/** Renders the Studio page form and reports dirty, warning, and blocking-error state to the parent. */
export function PageForm({
  initialValues,
  isSaving,
  mode = "create",
  bFocusFields = true,
  bCancelAlwaysEnabledInEdit = false,
  onSubmit,
  onReset,
  metadataConflict,
  onMetadataConflictChoice,
  onWarningKeysChange,
  onDirtyChange,
  onBlockingErrorsCountChange,
  parentOptions,
}: PageFormProps) {
  const {
    control,
    handleSubmit,
    reset: rhfReset,
    resetField,
    getValues,
    setValue,
  } = useForm<PageFormValues>({
    resolver: zodResolver(PageFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const resetBaselineRef = useRef(initialValues);
  const preserveMetadataOnParentRebaseRef = useRef(false);

  const {
    isDirty,
    isSubmitting,
    submitCount,
    isSubmitted,
    touchedFields,
    dirtyFields,
    errors,
  } = useFormState({ control });

  const isBusy = Boolean(isSaving || isSubmitting);
  const t = useTranslations();

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const formIdPrefix = useIdPrefix("page-form");
  const nameIds = createFieldIds(formIdPrefix, "name");
  const slugIds = createFieldIds(formIdPrefix, "slug");
  const seoTitleIds = createFieldIds(formIdPrefix, "seoTitle");
  const seoDescriptionIds = createFieldIds(formIdPrefix, "seoDescription");
  const sitemapIncludeIds = createFieldIds(formIdPrefix, "sitemapInclude");
  const sitemapPriorityIds = createFieldIds(formIdPrefix, "sitemapPriority");
  const sitemapChangefreqIds = createFieldIds(
    formIdPrefix,
    "sitemapChangefreq",
  );
  const parentIds = createFieldIds(formIdPrefix, "parentId");
  const paginationEnabledIds = createFieldIds(
    formIdPrefix,
    "paginationEnabled",
  );

  const slugAutoSyncRef = useRef(
    createSlugAutoSyncState({ initialValues, mode }),
  );

  useEffect(() => {
    if (mode !== "edit" || !bFocusFields || isBusy) return;

    queueMicrotask(() => {
      focusByFieldId(nameIds.fieldId);
    });
  }, [mode, bFocusFields, isBusy, initialValues, nameIds.fieldId]);

  const watchedValues =
    (useWatch({ control }) as PageFormValues | undefined) ?? initialValues;

  const values: PageFormValues = watchedValues ?? {
    name: "",
    seoTitle: null,
    seoDescription: null,
    slug: "",
    parentId: null,
    sitemap: null,
    paginationEnabled: false,
  };

  const isRootPage = values.parentId === null;

  useEffect(() => {
    if (!isRootPage) {
      preserveMetadataOnParentRebaseRef.current = false;
      return;
    }
    if (preserveMetadataOnParentRebaseRef.current) {
      preserveMetadataOnParentRebaseRef.current = false;
      return;
    }

    const current = getValues("paginationEnabled");
    if (current === false) return;

    setValue("paginationEnabled", false, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [isRootPage, getValues, setValue]);

  const includeInSitemap = Boolean(values.sitemap?.include);

  const warningKeys = usePageUiWarnings(values);

  useStableWarningKeys({
    warningKeys,
    onWarningKeysChange,
  });

  const NEAR = 10;
  const nameLen = (values.name ?? "").length;
  const remaining = Math.max(0, PAGE_NAME.MAX - nameLen);

  const helpName =
    remaining <= NEAR
      ? t("studio.pageForm.title.helpNearLimit", { remaining })
      : t("studio.pageForm.title.help");

  const helpSlug = useMemo(() => {
    const slug = (values.slug ?? "").trim();

    if (!slug) {
      return t("studio.pageForm.slug.helpEmpty");
    }

    const normalized = normalizeSlug(slug);
    if (normalized && normalized !== slug) {
      return t("studio.pageForm.slug.helpWillNormalize");
    }

    return t("studio.pageForm.slug.help");
  }, [values.slug, t]);

  const resetDisabledTooltip = isSaving
    ? t("common.saving")
    : isDirty === false
      ? t("studio.actionsBar.noChangesToReset")
      : t("common.actionUnavailable");

  const showError = isSubmitted || submitCount > 0;

  const invalidName =
    (showError || Boolean(touchedFields.name)) &&
    Boolean(errors.name?.message ?? errors.name);

  const nameErrorMessage =
    (showError || Boolean(touchedFields.name)) && errors.name
      ? String(errors.name.message)
      : undefined;

  const invalidSlug =
    (showError || Boolean(touchedFields.slug)) &&
    Boolean(errors.slug?.message ?? errors.slug);

  const slugErrorMessage =
    (showError || Boolean(touchedFields.slug)) && errors.slug?.message
      ? String(errors.slug.message)
      : undefined;

  const invalidSeoTitle =
    (showError || Boolean(touchedFields.seoTitle)) &&
    Boolean(errors.seoTitle?.message ?? errors.seoTitle);

  const seoTitleErrorMessage =
    (showError || Boolean(touchedFields.seoTitle)) && errors.seoTitle?.message
      ? String(errors.seoTitle.message)
      : undefined;

  const invalidSeoDescription =
    (showError || Boolean(touchedFields.seoDescription)) &&
    Boolean(errors.seoDescription?.message ?? errors.seoDescription);

  const seoDescriptionErrorMessage =
    (showError || Boolean(touchedFields.seoDescription)) &&
    errors.seoDescription?.message
      ? String(errors.seoDescription.message)
      : undefined;

  const blockingErrorsCount = useMemo(() => {
    return [
      invalidName,
      invalidSlug,
      invalidSeoTitle,
      invalidSeoDescription,
    ].filter(Boolean).length;
  }, [invalidName, invalidSlug, invalidSeoDescription, invalidSeoTitle]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  const submitLabel =
    mode === "edit" ? t("common.save") : t("studio.pageForm.actions.create");

  const submitLoadingLabel =
    mode === "edit"
      ? t("common.saving")
      : t("studio.pageForm.actions.creating");

  const sitemapChangefreqItems = useMemo(
    () =>
      CHANGEFREQ_VALUES.map((value) => ({
        value,
        label: t(`studio.pageForm.sitemap.changefreq.options.${value}`),
      })),
    [t],
  );

  function handleSubmitErrors(formErrors: FieldErrors<PageFormValues>) {
    notify.error(t("uiErrors.formHasErrors"));

    const fieldPriority: Array<keyof PageFormValues> = [
      "name",
      "slug",
      "seoTitle",
      "seoDescription",
    ];
    const first = fieldPriority.find((key) => Boolean(formErrors[key]));
    if (!first) return;

    const fieldIdByName: Partial<Record<keyof PageFormValues, string>> = {
      name: nameIds.fieldId,
      slug: slugIds.fieldId,
      seoTitle: seoTitleIds.fieldId,
      seoDescription: seoDescriptionIds.fieldId,
    };

    const targetId = fieldIdByName[first];
    if (!targetId) return;

    focusByFieldId(targetId);
  }

  const summaryBlock = (
    <FormGrid>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <InputField
            ids={nameIds}
            name={field.name}
            inputRef={field.ref}
            label={t("studio.pageForm.title.label")}
            value={field.value ?? ""}
            onChange={(value) => field.onChange(value)}
            onBlur={() =>
              handleNameBlur(
                field,
                getValues,
                setValue,
                slugAutoSyncRef.current,
              )
            }
            placeholder={
              mode === "edit"
                ? t("studio.pageForm.title.placeholderEdit")
                : t("studio.pageForm.title.placeholderCreate")
            }
            help={helpName}
            required
            minLength={PAGE_NAME.MIN}
            maxLength={PAGE_NAME.MAX}
            showCount
            autoCapitalize="sentences"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidName}
            error={nameErrorMessage}
            autoComplete="off"
          />
        )}
      />

      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <InputField
            ids={slugIds}
            name={field.name}
            inputRef={field.ref}
            label={t("studio.pageForm.slug.label")}
            value={field.value ?? ""}
            onChange={(value) => {
              const raw = String(value ?? "");
              const trimmed = raw.trim();

              const normalized =
                trimmed === SITE_PATH.home
                  ? SITE_PATH.home
                  : trimmed.replace(/^\/+/, "");

              if (
                normalized !== SITE_PATH.home &&
                normalized !== slugAutoSyncRef.current.lastAutoSlug
              ) {
                slugAutoSyncRef.current.locked = true;
              }

              field.onChange(normalized);
            }}
            onBlur={field.onBlur}
            placeholder={
              mode === "edit"
                ? t("studio.pageForm.slug.placeholderEdit")
                : t("studio.pageForm.slug.placeholderCreate")
            }
            help={helpSlug}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            pattern={SLUG_FINAL_RE.source}
            title={t("studio.pageForm.slug.inputTitle")}
            disabled={isBusy}
            invalid={invalidSlug}
            error={slugErrorMessage}
          />
        )}
      />

      <Controller
        name="parentId"
        control={control}
        render={({ field }) => (
          <SelectField
            ids={parentIds}
            name={field.name}
            label={t("studio.pageForm.parent.label")}
            help={t("studio.pageForm.parent.help")}
            value={field.value ?? NO_PARENT_VALUE}
            onChange={(value) => {
              const next = String(value ?? "").trim();

              if (next === NO_PARENT_VALUE) {
                field.onChange(null);
                setValue("paginationEnabled", false, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                return;
              }

              const parentId = next.length === 0 ? null : next;
              field.onChange(parentId);

              if (parentId === null) {
                setValue("paginationEnabled", false, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }
            }}
            items={[
              {
                value: NO_PARENT_VALUE,
                label: t("studio.pageForm.parent.none"),
              },
              ...(parentOptions ?? []).map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            disabled={isBusy}
          />
        )}
      />

      <Controller
        name="paginationEnabled"
        control={control}
        render={({ field }) => (
          <SwitchField
            ids={paginationEnabledIds}
            name={field.name}
            label={t("studio.pageForm.pagination.label")}
            help={
              isRootPage
                ? t("studio.pageForm.pagination.helpRootForcedOff")
                : t("studio.pageForm.pagination.help")
            }
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => {
              if (isRootPage) {
                field.onChange(false);
                return;
              }

              field.onChange(Boolean(checked));
            }}
            disabled={isBusy || isRootPage}
          />
        )}
      />
    </FormGrid>
  );

  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={(event) => {
        void handleSubmit(
          async (formValues) => {
            if (hasUnresolvedPageMetadataConflicts(metadataConflict)) {
              return;
            }

            const result = await onSubmit(formValues, dirtyFields);
            if (!result) return;

            if ("rebaseParentId" in result) {
              preserveMetadataOnParentRebaseRef.current =
                result.rebaseParentId === null;
              resetBaselineRef.current = applyPageFormParentRebase(
                resetBaselineRef.current,
                resetField,
                result.rebaseParentId,
              );
              return;
            }

            resetBaselineRef.current = result.rebaseValues;
            rhfReset(result.rebaseValues, {
              keepDirty: false,
              keepTouched: true,
              keepErrors: true,
            });
            slugAutoSyncRef.current = createSlugAutoSyncState({
              initialValues: result.rebaseValues,
              mode,
            });
          },
          handleSubmitErrors,
        )(event);
      }}
      noValidate
    >
      <Card variant="panel" visualMode="studio">
        <CardContent>
          <ExpandableLayout
            id={`${formIdPrefix}-sitemap`}
            label={t("studio.pageForm.sitemap.expandableLabel")}
            defaultOpen={false}
            disabled={isBusy}
            summary={summaryBlock}
          >
            <div className={cn(STACK_SM, "px-2")}>
              <Controller
                name="sitemap.include"
                control={control}
                render={({ field }) => (
                  <SwitchField
                    ids={sitemapIncludeIds}
                    name={field.name}
                    label={t("studio.pageForm.sitemap.include.label")}
                    help={t("studio.pageForm.sitemap.include.help")}
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => {
                      const current = getValues("sitemap");

                      setValue(
                        "sitemap",
                        {
                          include: checked,
                          priority: current?.priority ?? null,
                          changefreq: current?.changefreq ?? null,
                        },
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        },
                      );
                    }}
                    disabled={isBusy}
                  />
                )}
              />

              <Controller
                name="seoTitle"
                control={control}
                render={({ field }) => (
                  <InputField
                    ids={seoTitleIds}
                    name={field.name}
                    inputRef={field.ref}
                    label={t("studio.pageForm.seoTitle.label")}
                    value={field.value ?? ""}
                    onChange={(value) => field.onChange(value)}
                    onBlur={field.onBlur}
                    placeholder={t("studio.pageForm.seoTitle.placeholder")}
                    help={t("studio.pageForm.seoTitle.help")}
                    maxLength={PAGE_SEO_TITLE.MAX}
                    showCount
                    autoCapitalize="sentences"
                    spellCheck={false}
                    disabled={isBusy}
                    invalid={invalidSeoTitle}
                    error={seoTitleErrorMessage}
                  />
                )}
              />

              <Controller
                name="seoDescription"
                control={control}
                render={({ field }) => (
                  <TextareaField
                    ids={seoDescriptionIds}
                    name={field.name}
                    label={t("studio.pageForm.seoDescription.label")}
                    value={field.value ?? ""}
                    onChange={(value) => field.onChange(value)}
                    onBlur={field.onBlur}
                    placeholder={t(
                      "studio.pageForm.seoDescription.placeholder",
                    )}
                    help={t("studio.pageForm.seoDescription.help")}
                    maxLength={PAGE_SEO_DESCRIPTION.MAX}
                    showCount
                    autoCapitalize="sentences"
                    spellCheck
                    disabled={isBusy}
                    invalid={invalidSeoDescription}
                    error={seoDescriptionErrorMessage}
                    rows={3}
                  />
                )}
              />

              <div
                className={cn(
                  "grid gap-2 md:grid-cols-[minmax(0,1.085fr)_minmax(0,1fr)_minmax(0,auto)] md:items-start lg:gap-4",
                )}
              >
                <Controller
                  name="sitemap.priority"
                  control={control}
                  render={({ field }) => {
                    const raw = field.value;
                    const value =
                      raw === null || raw === undefined ? "" : String(raw);

                    return (
                      <InputField
                        ids={sitemapPriorityIds}
                        name={field.name}
                        label={t("studio.pageForm.sitemap.priority.label")}
                        value={value}
                        onChange={(nextValue) => {
                          const normalized = String(nextValue ?? "").trim();

                          if (!normalized) {
                            field.onChange(null);
                            return;
                          }

                          const parsed = Number(normalized);
                          field.onChange(
                            Number.isFinite(parsed) ? parsed : null,
                          );
                        }}
                        onBlur={() => {
                          const current = field.value;

                          if (typeof current === "number") {
                            field.onChange(Math.min(1, Math.max(0, current)));
                          }

                          field.onBlur();
                        }}
                        placeholder={t(
                          "studio.pageForm.sitemap.priority.placeholder",
                        )}
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        disabled={isBusy || !includeInSitemap}
                        help={t("studio.pageForm.sitemap.priority.help")}
                      />
                    );
                  }}
                />

                <Controller
                  name="sitemap.changefreq"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      ids={sitemapChangefreqIds}
                      name={field.name}
                      label={t("studio.pageForm.sitemap.changefreq.label")}
                      value={field.value ?? ""}
                      help={t("studio.pageForm.sitemap.changefreq.help")}
                      onChange={(value) => {
                        field.onChange(value ? value : null);
                      }}
                      items={sitemapChangefreqItems}
                      disabled={isBusy || !includeInSitemap}
                    />
                  )}
                />

                <div className={cn("md:justify-self-end")}>
                  <div className="flex h-9 items-center justify-end md:mt-[1.6rem]">
                    <TooltipButton
                      type="button"
                      variant="outline"
                      visualMode="studio"
                      size="icon"
                      onPointerDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => {
                        setValue("sitemap.priority", null, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });

                        setValue("sitemap.changefreq", null, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                      disabled={isBusy || !includeInSitemap}
                      tooltip={
                        isBusy || !includeInSitemap
                          ? resetDisabledTooltip
                          : t("common.reset")
                      }
                    >
                      <RotateCcw />
                    </TooltipButton>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableLayout>
        </CardContent>

        {metadataConflict && onMetadataConflictChoice ? (
          <div className="px-6 pb-4">
            <PageMetadataConflictPanel
              state={metadataConflict}
              onChoice={(field, choice) => {
                const resolution = onMetadataConflictChoice(
                  field,
                  choice,
                  getValues(),
                );
                setResolvedConflictValue(setValue, resolution);
              }}
            />
          </div>
        ) : null}

        <CardFooter>
          <ActionsBar
            variant="resetSubmit"
            isSaving={isSaving || isSubmitting}
            isDirty={
              mode === "edit" && !bCancelAlwaysEnabledInEdit ? true : isDirty
            }
            resetLabel={mode === "edit" ? t("common.cancel") : undefined}
            submitLabel={submitLabel}
            submitLoadingLabel={submitLoadingLabel}
            onReset={() => {
              rhfReset(resetBaselineRef.current, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });

              slugAutoSyncRef.current = createSlugAutoSyncState({
                initialValues: resetBaselineRef.current,
                mode,
              });
              onReset?.(resetBaselineRef.current);
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

PageForm.displayName = "PageForm";

function setResolvedConflictValue(
  setValue: UseFormSetValue<PageFormValues>,
  resolution: PageMetadataConflictResolution,
): void {
  const options = {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  } as const;

  switch (resolution.field) {
    case "name":
    case "slug":
      setValue(resolution.field, String(resolution.localValue ?? ""), options);
      return;
    case "seoTitle":
    case "seoDescription":
      setValue(
        resolution.field,
        resolution.localValue === null
          ? null
          : String(resolution.localValue ?? ""),
        options,
      );
      return;
    case "paginationEnabled":
      setValue(
        resolution.field,
        Boolean(resolution.localValue),
        options,
      );
      return;
    case "sitemap":
      setValue(
        resolution.field,
        resolution.localValue as PageFormValues["sitemap"],
        options,
      );
  }
}

/** Auto-updates the slug from the name on blur until the user manually locks the slug. */
function handleNameBlur(
  field: { onBlur: () => void },
  getValues: (name: "name" | "slug") => string | undefined,
  setValue: UseFormSetValue<PageFormValues>,
  slugAutoSyncState: SlugAutoSyncState,
) {
  field.onBlur();

  const nextAutoSlug = getAutoSlugFromName({
    name: getValues("name") ?? "",
    slug: getValues("slug") ?? "",
    state: slugAutoSyncState,
  });

  if (nextAutoSlug === null) return;

  setValue("slug", nextAutoSlug, {
    shouldDirty: true,
    shouldTouch: false,
    shouldValidate: true,
  });
}
