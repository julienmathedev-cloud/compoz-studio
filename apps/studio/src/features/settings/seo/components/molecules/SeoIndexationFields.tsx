/**
 * @file apps/studio/src/features/settings/seo/components/molecules/SeoIndexationFields.tsx
 * @layer ui/studio/molecules
 * @description Composant de champs d’indexation SEO pour le formulaire du studio.
 * @remarks Inclut les contrôles d’indexation et de données structurées avec gestion RHF.
 */

import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { HelperChips } from "@compoz/studio/components/molecules/controls/HelperChips";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

type SeoIndexationFieldsProps = Readonly<{
  control: Control<SeoFormValues>;
  idPrefix: string;

  baseUrlIds: FieldIds;
  canonicalUrlIds: FieldIds;
  robotsIds: FieldIds;

  isBusy: boolean;
  t: (key: string) => string;

  invalidBaseUrl: boolean;
  baseUrlError?: string;

  invalidCanonicalUrl: boolean;
  canonicalUrlError?: string;

  invalidRobots: boolean;
  robotsError?: string;
}>;

/**
 * Toggle un token dans une liste CSV :
 * - si présent (case-insensitive) -> retire
 * - si absent -> ajoute
 * - normalise en "a,b,c" (trim + suppression vides)
 */
function toggleCsvToken(prev: string, token: string) {
  const t = token.trim();
  if (!t) return prev;

  const parts = prev
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const lower = parts.map((p) => p.toLowerCase());
  const tLower = t.toLowerCase();

  const EXCLUSIVE_MAP: Record<string, string> = {
    index: "noindex",
    noindex: "index",
    follow: "nofollow",
    nofollow: "follow",
  };

  const opposite = EXCLUSIVE_MAP[tLower];

  // Si déjà présent → on retire (toggle off)
  const alreadyIndex = lower.findIndex((p) => p === tLower);
  if (alreadyIndex >= 0) {
    const next = parts
      .slice(0, alreadyIndex)
      .concat(parts.slice(alreadyIndex + 1));

    return next.join(",");
  }

  // Supprime l'opposé si présent
  let nextParts = parts;
  if (opposite) {
    nextParts = parts.filter((p) => p.toLowerCase() !== opposite);
  }

  // Ajoute le token
  return [...nextParts, t].join(",");
}

export function SeoIndexationFields({
  control,
  idPrefix,
  baseUrlIds,
  isBusy,
  t,
  invalidBaseUrl,
  baseUrlError,
  canonicalUrlIds,
  invalidCanonicalUrl,
  canonicalUrlError,
  robotsIds,
  invalidRobots,
  robotsError,
}: SeoIndexationFieldsProps) {
  const structuredDataEnabledIds = createFieldIds(
    idPrefix,
    "structuredData.enabled",
  );
  const structuredDataTypeIds = createFieldIds(
    idPrefix,
    "structuredData.entityType",
  );

  const structuredDataEnabled = useWatch({
    control,
    name: "structuredData.enabled",
  });
  const entityType = useWatch({
    control,
    name: "structuredData.entityType",
  });

  const showLocalFields = [
    "localBusiness",
    "professionalService",
    "autoRepair",
  ].includes(entityType);

  const entityTypes = [
    "person",
    "organization",
    "localBusiness",
    "professionalService",
    "visualArtist",
    "autoRepair",
  ] as const;

  return (
    <div className={cn(STACK_MD)}>
      <Controller
        name="baseUrl"
        control={control}
        render={({ field }) => (
          <InputField
            ids={baseUrlIds}
            name={field.name}
            label={t("studio.seoForm.indexing.baseUrl.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            placeholder={t("studio.seoForm.indexing.baseUrl.placeholder")}
            help={t("studio.seoForm.indexing.baseUrl.help")}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidBaseUrl}
            error={baseUrlError}
          />
        )}
      />

      <Controller
        name="canonicalUrl"
        control={control}
        render={({ field }) => (
          <InputField
            ids={canonicalUrlIds}
            name={field.name}
            label={t("studio.seoForm.indexing.canonicalUrl.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            placeholder={t("studio.seoForm.indexing.canonicalUrl.placeholder")}
            help={t("studio.seoForm.indexing.canonicalUrl.help")}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            invalid={invalidCanonicalUrl}
            error={canonicalUrlError}
          />
        )}
      />

      <Controller
        name="robots"
        control={control}
        render={({ field }) => (
          <>
            <InputField
              ids={robotsIds}
              name={field.name}
              label={t("studio.seoForm.indexing.robots.label")}
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              placeholder={t("studio.seoForm.indexing.robots.placeholder")}
              help={t("studio.seoForm.indexing.robots.help")}
              disabled={isBusy}
              invalid={invalidRobots}
              error={robotsError}
            />

            <HelperChips
              items={[
                "index",
                "follow",
                "noindex",
                "nofollow",
                "max-snippet:160",
                "max-image-preview:large",
                "max-video-preview:10",
              ]}
              onPick={(chip) => {
                const next = toggleCsvToken(String(field.value ?? ""), chip);
                field.onChange(next);
              }}
            />
          </>
        )}
      />

      <Controller
        name="structuredData.enabled"
        control={control}
        render={({ field }) => (
          <SwitchField
            ids={structuredDataEnabledIds}
            name={field.name}
            label={t("studio.seoForm.indexing.structuredData.label")}
            help={t("studio.seoForm.indexing.structuredData.help")}
            checked={Boolean(field.value)}
            onCheckedChange={(v) => field.onChange(v === true)}
            disabled={isBusy}
          />
        )}
      />

      {structuredDataEnabled ? (
        <div className={cn(STACK_MD)}>
          <Controller
            name="structuredData.entityType"
            control={control}
            render={({ field }) => (
              <SelectField
                ids={structuredDataTypeIds}
                name={field.name}
                label={t(
                  "studio.seoForm.indexing.structuredData.entityType.label",
                )}
                help={t(
                  "studio.seoForm.indexing.structuredData.entityType.help",
                )}
                value={field.value}
                onChange={field.onChange}
                disabled={isBusy}
                items={entityTypes.map((value) => ({
                  value,
                  label: t(
                    `studio.seoForm.indexing.structuredData.entityType.options.${value}`,
                  ),
                }))}
              />
            )}
          />

          <FormGrid>
            {(["name", "telephone", "email"] as const).map((name) => (
              <Controller
                key={name}
                name={`structuredData.${name}`}
                control={control}
                render={({ field }) => (
                  <InputField
                    ids={createFieldIds(idPrefix, `structuredData.${name}`)}
                    name={field.name}
                    label={t(
                      `studio.seoForm.indexing.structuredData.${name}.label`,
                    )}
                    help={t(
                      `studio.seoForm.indexing.structuredData.${name}.help`,
                    )}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isBusy}
                  />
                )}
              />
            ))}
          </FormGrid>

          <Controller
            name="structuredData.description"
            control={control}
            render={({ field }) => (
              <TextareaField
                ids={createFieldIds(idPrefix, "structuredData.description")}
                name={field.name}
                label={t(
                  "studio.seoForm.indexing.structuredData.description.label",
                )}
                help={t(
                  "studio.seoForm.indexing.structuredData.description.help",
                )}
                value={field.value}
                onChange={field.onChange}
                rows={4}
                disabled={isBusy}
              />
            )}
          />

          {showLocalFields ? (
            <>
              <FormGrid>
                {(
                  [
                    "streetAddress",
                    "postalCode",
                    "addressLocality",
                    "addressRegion",
                    "addressCountry",
                  ] as const
                ).map((name) => (
                  <Controller
                    key={name}
                    name={`structuredData.address.${name}`}
                    control={control}
                    render={({ field }) => (
                      <InputField
                        ids={createFieldIds(
                          idPrefix,
                          `structuredData.address.${name}`,
                        )}
                        name={field.name}
                        label={t(
                          `studio.seoForm.indexing.structuredData.address.${name}`,
                        )}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isBusy}
                      />
                    )}
                  />
                ))}
              </FormGrid>

              <Controller
                name="structuredData.priceRange"
                control={control}
                render={({ field }) => (
                  <InputField
                    ids={createFieldIds(idPrefix, "structuredData.priceRange")}
                    name={field.name}
                    label={t(
                      "studio.seoForm.indexing.structuredData.priceRange.label",
                    )}
                    help={t(
                      "studio.seoForm.indexing.structuredData.priceRange.help",
                    )}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isBusy}
                  />
                )}
              />

              {(["areaServed", "openingHours"] as const).map((name) => (
                <Controller
                  key={name}
                  name={`structuredData.${name}`}
                  control={control}
                  render={({ field }) => (
                    <TextareaField
                      ids={createFieldIds(idPrefix, `structuredData.${name}`)}
                      name={field.name}
                      label={t(
                        `studio.seoForm.indexing.structuredData.${name}.label`,
                      )}
                      help={t(
                        `studio.seoForm.indexing.structuredData.${name}.help`,
                      )}
                      value={(field.value ?? []).join("\n")}
                      onChange={(value) => field.onChange(value.split("\n"))}
                      rows={4}
                      disabled={isBusy}
                    />
                  )}
                />
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

SeoIndexationFields.displayName = "SeoIndexationFields";
