"use client";

/**
 * @file apps/studio/src/features/pages/forms/PageForm.tsx
 * @layer ui/organisms
 *
 * @description
 * Formulaire d’édition d’une page (titre + slug) — RHF + Zod comme source de vérité UI.
 *
 * @remarks
 * - Contrôlé : le parent fournit `initialValues` et reçoit `onSubmit`.
 * - Les warnings UI (non bloquants) sont dérivés des valeurs RHF et remontés au parent.
 * - Les erreurs bloquantes sont affichées au plus près des champs (near-field).
 * - UX : auto-sync du slug depuis le titre tant que l’utilisateur n’a pas “lock” le slug.
 * - UX : focus/scroll du premier champ invalide au submit.
 * - UX : focus impératif du champ titre via IDs stables (sans ref).
 */

import { PAGE_TITLE } from "@compoz/core/constants/limits/pages";
import { SLUG_FINAL_RE } from "@compoz/core/domain/slug/constants";
import { normalizeSlug } from "@compoz/core/domain/slug/utils";
import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import {
  PageFormSchema,
  type PageFormValues,
} from "@compoz/validation/pages/page-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import {
  usePageUiWarnings,
  type PageWarningKey,
} from "@compoz/studio/features/pages/validation/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";
import { Controller, useForm, useFormState, useWatch } from "react-hook-form";

type ParentOption = Readonly<{ value: string; label: string }>;

/**
 * Props du composant `PageForm`.
 */
type PageFormProps = Readonly<{
  /** Valeurs initiales (baseline) fournies par la section. */
  initialValues: PageFormValues;

  /** Indique qu’une sauvegarde côté parent est en cours. */
  isSaving?: boolean;

  parentOptions?: ReadonlyArray<ParentOption>;

  /** Mode UI (impacte labels et actions). */
  mode?: "create" | "edit";

  /* Active/déscative l’auto-focus des champs du formulaire (sauf celui des erreurs) */
  bFocusFields?: boolean;

  /* Permet d'annuler le comportement bouton “annuler” toujours actif en mode edit*/
  bCancelAlwaysEnabledInEdit?: boolean;

  /** Callback appelé avec des valeurs validées par Zod (`PageFormSchema`). */
  onSubmit: (values: PageFormValues) => void | Promise<void>;

  /** Handler optionnel : permet au parent de réagir à un reset UI. */
  onReset?: () => void;

  /** Handler optionnel : remonte les warnings UI (non bloquants). */
  onWarningKeysChange?: (keys: PageWarningKey[]) => void;

  /** Handler optionnel : remonte l’état dirty (guard / navigation). */
  onDirtyChange?: (dirty: boolean) => void;

  /** Handler optionnel : remonte le nombre d’erreurs bloquantes (badges section). */
  onBlockingErrorsCountChange?: (count: number) => void;
}>;

const NO_PARENT_VALUE = "__none__";

/**
 * Formulaire de configuration d’une page (admin).
 */
export function PageForm({
  initialValues,
  isSaving,
  mode = "create",
  bFocusFields = true,
  bCancelAlwaysEnabledInEdit = false,
  onSubmit,
  onReset,
  onWarningKeysChange,
  onDirtyChange,
  onBlockingErrorsCountChange,
  parentOptions,
}: PageFormProps) {
  const {
    control,
    handleSubmit,
    reset: rhfReset,
    getValues,
    setValue,
  } = useForm<PageFormValues>({
    resolver: zodResolver(PageFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const {
    isDirty,
    isSubmitting,
    submitCount,
    isSubmitted,
    touchedFields,
    errors,
  } = useFormState({ control });

  // Busy local uniquement (le chargement initial est géré par la section).
  const isBusy = Boolean(isSaving || isSubmitting);
  const t = useTranslations();

  // Dirty signal vers le parent (guard / navigation).
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Préfixe d’ID stable pour ce formulaire.
  const formIdPrefix = useIdPrefix("page-form");
  const titleIds = createFieldIds(formIdPrefix, "title");
  const slugIds = createFieldIds(formIdPrefix, "slug");
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

  /**
   * Focus basé sur IDs stables (sans ref).
   *
   * @remarks
   * Scroll au centre puis focus après micro-délai (layout stable).
   */
  const focusById = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    setTimeout(() => {
      (el as HTMLElement).focus?.();
    }, 50);
  };

  /**
   * UX auto-sync :
   * - Tant que l’utilisateur n’a pas modifié le slug, on le dérive du titre au blur.
   * - Dès que l’utilisateur modifie le slug (différent du dernier auto), on "lock" l’auto-sync.
   */
  const slugLockedRef = useRef(false);
  const lastAutoSlugRef = useRef<string>("");

  // Resynchronisation RHF lorsque `initialValues` change (reload côté section).
  useEffect(() => {
    rhfReset(initialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });

    // Reset du comportement auto-sync.
    slugLockedRef.current = false;
    const initialSlug = (initialValues.slug ?? "").trim();
    lastAutoSlugRef.current =
      initialSlug === "/" ? "/" : normalizeSlug(initialSlug);
  }, [initialValues, rhfReset]);

  // Focus auto du champ titre en mode edit (changement de page).
  useEffect(() => {
    if (mode !== "edit" || !bFocusFields) return;
    if (isBusy) return;

    // Laisse le temps au DOM de render après reset / changement de section.
    queueMicrotask(() => focusById(titleIds.fieldId));
  }, [mode, bFocusFields, isBusy, initialValues, titleIds.fieldId]);

  // Valeurs live pour helpers + warnings
  const watchedValues =
    (useWatch({ control }) as PageFormValues | undefined) ?? initialValues;

  const values: PageFormValues = watchedValues ?? { title: "", slug: "" };

  // ✅ Root page = parentId === null
  const isRootPage = values.parentId === null;

  // ✅ Forcing UI : si root => paginationEnabled doit être false
  useEffect(() => {
    if (!isRootPage) return;

    const current = getValues("paginationEnabled");
    if (current === false) return;

    setValue("paginationEnabled", false, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [isRootPage, getValues, setValue]);

  const includeInSitemap = Boolean(values.sitemap?.include);

  // Warnings UI (non bloquants).
  const warningKeys = usePageUiWarnings(values);

  useEffect(() => {
    onWarningKeysChange?.(warningKeys);
  }, [warningKeys, onWarningKeysChange]);

  // Aides dynamiques (non bloquantes).
  const NEAR = 10;
  const titleLen = (values.title ?? "").length;
  const remaining = Math.max(0, PAGE_TITLE.MAX - titleLen);

  const helpTitle =
    remaining <= NEAR
      ? t("admin.pageForm.title.helpNearLimit", { remaining })
      : t("admin.pageForm.title.help");

  const helpSlug = useMemo(() => {
    const s = (values.slug ?? "").trim();
    if (!s) {
      return t("admin.pageForm.slug.helpEmpty");
    }
    const normalized = normalizeSlug(s);
    if (normalized && normalized !== s) {
      return t("admin.pageForm.slug.helpWillNormalize");
    }
    return t("admin.pageForm.slug.help");
  }, [values.slug, t]);

  const resetDisabledTooltip = isSaving
    ? t("common.saving")
    : isDirty === false
      ? t("admin.actionsBar.noChangesToReset")
      : t("common.actionUnavailable");

  // Erreurs near-field (affichées au plus près des champs).
  const showError = isSubmitted || submitCount > 0;

  const invalidTitle =
    (showError || !!touchedFields.title) &&
    Boolean(errors.title?.message ?? errors.title);

  const titleErrorMessage =
    (showError || !!touchedFields.title) && errors.title
      ? String(errors.title.message)
      : undefined;

  const invalidSlug =
    (showError || !!touchedFields.slug) &&
    Boolean(errors.slug?.message ?? errors.slug);

  const slugErrorMessage =
    (showError || !!touchedFields.slug) && errors.slug?.message
      ? String(errors.slug.message)
      : undefined;

  // ✅ Badges section : compteur d’erreurs bloquantes (simple & stable)
  const blockingErrorsCount = useMemo(() => {
    const invalids = [invalidTitle, invalidSlug];
    return invalids.filter(Boolean).length;
  }, [invalidTitle, invalidSlug]);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  // Labels de boutons.
  const submitLabel =
    mode === "edit" ? t("common.save") : t("admin.pageForm.actions.create");

  const submitLoadingLabel =
    mode === "edit" ? t("common.saving") : t("admin.pageForm.actions.creating");

  // Gestion des erreurs de soumission : focus/scroll du premier champ invalide.
  function handleSubmitErrors(formErrors: FieldErrors<PageFormValues>) {
    notify.error(t("uiErrors.formHasErrors"));

    // Focus/scroll du premier champ invalide (simple & efficace)
    const FIELD_PRIORITY: Array<keyof PageFormValues> = ["title", "slug"];

    const first = FIELD_PRIORITY.find((k) => !!formErrors[k]);
    if (!first) return;

    const idByField: Partial<Record<keyof PageFormValues, string>> = {
      title: titleIds.fieldId,
      slug: slugIds.fieldId,
    };

    const targetId = idByField[first];
    if (!targetId) return;

    focusById(targetId);
  }

  const summaryBlock = (
    <FormGrid>
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <InputField
            ids={titleIds}
            inputRef={field.ref}
            label={t("admin.pageForm.title.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={() =>
              handleTitleBlur(
                field,
                getValues,
                setValue,
                slugLockedRef,
                lastAutoSlugRef,
              )
            }
            placeholder={
              mode === "edit"
                ? t("admin.pageForm.title.placeholderEdit")
                : t("admin.pageForm.title.placeholderCreate")
            }
            help={helpTitle}
            required
            minLength={PAGE_TITLE.MIN}
            maxLength={PAGE_TITLE.MAX}
            showCount
            autoCapitalize="sentences"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidTitle}
            error={titleErrorMessage}
          />
        )}
      />
      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <InputField
            ids={slugIds}
            inputRef={field.ref}
            label={t("admin.pageForm.slug.label")}
            value={field.value ?? ""}
            onChange={(v) => {
              const raw = (v ?? "").toString();

              const trimmed = raw.trim();

              // ✅ "/" (home) reste "/"
              const normalized =
                trimmed === "/" ? "/" : trimmed.replace(/^\/+/, "");

              // lock auto-sync si l’utilisateur modifie réellement
              if (
                normalized !== "/" &&
                normalized !== lastAutoSlugRef.current
              ) {
                slugLockedRef.current = true;
              }

              field.onChange(normalized);
            }}
            onBlur={field.onBlur}
            placeholder={
              mode === "edit"
                ? t("admin.pageForm.slug.placeholderEdit")
                : t("admin.pageForm.slug.placeholderCreate")
            }
            help={helpSlug}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            pattern={SLUG_FINAL_RE.source}
            title={t("admin.pageForm.slug.inputTitle")}
            disabled={isBusy}
            invalid={invalidSlug}
            error={slugErrorMessage}
          />
        )}
      />
      {/* ✅ Parent */}
      <Controller
        name="parentId"
        control={control}
        render={({ field }) => (
          <SelectField
            ids={parentIds}
            label={t("admin.pageForm.parent.label")}
            help={t("admin.pageForm.parent.help")}
            value={field.value ?? NO_PARENT_VALUE}
            onChange={(val) => {
              const next = String(val ?? "").trim();

              if (next === NO_PARENT_VALUE) {
                field.onChange(null);

                // ✅ forcing immédiat (UX)
                setValue("paginationEnabled", false, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });

                return;
              }
              const parentId = next.length === 0 ? null : next;
              field.onChange(parentId);

              // (optionnel) si on repasse en root
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
                label: t("admin.pageForm.parent.none"),
              },
              ...(parentOptions ?? []).map((opt) => ({
                value: opt.value,
                label: opt.label,
              })),
            ]}
            disabled={isBusy}
          />
        )}
      />
      {/* ✅ Pagination */}
      <Controller
        name="paginationEnabled"
        control={control}
        render={({ field }) => (
          <SwitchField
            ids={paginationEnabledIds}
            label={t("admin.pageForm.pagination.label")}
            help={
              isRootPage
                ? t("admin.pageForm.pagination.helpRootForcedOff")
                : t("admin.pageForm.pagination.help")
            }
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => {
              // ✅ si root, on ignore (forcé off)
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

  // Render.
  return (
    <form
      aria-busy={isBusy || undefined}
      onSubmit={handleSubmit(
        (formValues) => onSubmit(formValues),
        handleSubmitErrors,
      )}
      noValidate
    >
      <Card variant="panel">
        <CardContent>
          {/* Sitemap (options avancées) */}
          <ExpandableLayout
            id={`${formIdPrefix}-sitemap`}
            label={t("admin.pageForm.sitemap.expandableLabel")}
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
                    label={t("admin.pageForm.sitemap.include.label")}
                    help={t("admin.pageForm.sitemap.include.help")}
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => {
                      // Assure l'existence du sous-objet sitemap même si absent en baseline.
                      const current = getValues("sitemap");
                      setValue(
                        "sitemap",
                        {
                          ...(current ?? {}),
                          include: checked,
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
              <div
                className={cn(
                  "md:grid-cols-[minmax(0,1.085fr)_minmax(0,1fr)_minmax(0,auto)] md:items-start grid gap-2 lg:gap-4",
                )}
              >
                {/* Colonne 1 */}
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
                        label={t("admin.pageForm.sitemap.priority.label")}
                        value={value}
                        onChange={(v) => {
                          const s = String(v ?? "").trim();
                          if (!s) {
                            field.onChange(null);
                            return;
                          }
                          const n = Number(s);
                          field.onChange(Number.isFinite(n) ? n : null);
                        }}
                        onBlur={() => {
                          const current = field.value;
                          if (typeof current === "number") {
                            field.onChange(Math.min(1, Math.max(0, current)));
                          }
                          field.onBlur();
                        }}
                        placeholder={t(
                          "admin.pageForm.sitemap.priority.placeholder",
                        )}
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        disabled={isBusy || !includeInSitemap}
                        help={t("admin.pageForm.sitemap.priority.help")}
                      />
                    );
                  }}
                />

                {/* Colonne 2 */}
                <Controller
                  name="sitemap.changefreq"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      ids={sitemapChangefreqIds}
                      label={t("admin.pageForm.sitemap.changefreq.label")}
                      value={field.value ?? ""}
                      help={t("admin.pageForm.sitemap.changefreq.help")}
                      onChange={(val) => {
                        field.onChange(val ? val : null);
                      }}
                      items={[
                        {
                          value: "always",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.always",
                          ),
                        },
                        {
                          value: "hourly",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.hourly",
                          ),
                        },
                        {
                          value: "daily",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.daily",
                          ),
                        },
                        {
                          value: "weekly",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.weekly",
                          ),
                        },
                        {
                          value: "monthly",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.monthly",
                          ),
                        },
                        {
                          value: "yearly",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.yearly",
                          ),
                        },
                        {
                          value: "never",
                          label: t(
                            "admin.pageForm.sitemap.changefreq.options.never",
                          ),
                        },
                      ]}
                      disabled={isBusy || !includeInSitemap}
                    />
                  )}
                />

                {/* Colonne actions (droite) */}
                <div className={cn("md:justify-self-end")}>
                  {/* align vertical avec les champs (comme ton MENU_ITEM_LAYOUT) */}
                  <div className="md:mt-[1.6rem] flex h-9 items-center justify-end">
                    <TooltipButton
                      type="button"
                      variant="outline"
                      size="icon"
                      onPointerDown={(e) => {
                        // ✅ empêche la perte de focus => évite le blur des inputs
                        e.preventDefault();
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

        <CardFooter>
          <ActionsBar
            variant={"resetSubmit"}
            isSaving={isSaving || isSubmitting}
            isDirty={
              mode === "edit" && !bCancelAlwaysEnabledInEdit ? true : isDirty
            }
            resetLabel={mode === "edit" ? t("common.cancel") : undefined}
            submitLabel={submitLabel}
            submitLoadingLabel={submitLoadingLabel}
            onReset={() => {
              // Reset UI immédiat (RHF).
              rhfReset(initialValues, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });

              // Reset auto-sync (cohérent avec la baseline).
              slugLockedRef.current = false;
              const initialSlug = (initialValues.slug ?? "").trim();
              lastAutoSlugRef.current =
                initialSlug === "/" ? "/" : normalizeSlug(initialSlug);

              // Puis notification côté parent (si besoin).
              onReset?.();
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

PageForm.displayName = "PageForm";

// Extraction de la logique onBlur du champ title en une fonction locale
function handleTitleBlur(
  field: { onBlur: () => void },
  getValues: (name: "title" | "slug") => string | undefined,
  setValue: UseFormSetValue<PageFormValues>,
  slugLockedRef: ReturnType<typeof useRef<boolean>>,
  lastAutoSlugRef: ReturnType<typeof useRef<string>>,
) {
  field.onBlur();

  // Auto-sync slug depuis title au blur, tant que l’utilisateur n’a pas pris la main.
  const titleNow = (getValues("title") ?? "").trim();
  const slugNow = (getValues("slug") ?? "").trim();

  // ✅ HOME : ne jamais auto-sync (slug "/" est une décision explicite)
  if (slugNow === "/") return;

  const nextAuto = normalizeSlug(titleNow);

  const canAutoUpdate =
    !slugLockedRef.current &&
    (slugNow === "" || slugNow === lastAutoSlugRef.current);

  if (!canAutoUpdate) return;

  // Évite de marquer dirty si rien ne change.
  if (slugNow === nextAuto) {
    lastAutoSlugRef.current = nextAuto;
    return;
  }

  setValue("slug", nextAuto, {
    shouldDirty: true,
    shouldTouch: false,
    shouldValidate: true,
  });

  lastAutoSlugRef.current = nextAuto;
}
