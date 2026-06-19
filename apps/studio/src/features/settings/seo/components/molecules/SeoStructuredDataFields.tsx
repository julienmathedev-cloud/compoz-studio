/**
 * @file apps/studio/src/features/settings/seo/components/molecules/SeoStructuredDataFields.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Champs de données structurées JSON-LD / Schema.org pour le formulaire SEO.
 *
 * @remarks
 * - Séparé de l’indexation pour permettre un layout pleine largeur.
 * - Gère le toggle JSON-LD, le type Schema.org et les champs associés.
 * - Les champs locaux sont affichés uniquement pour les entités locales.
 */

import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

type SeoStructuredDataFieldsProps = Readonly<{
  control: Control<SeoFormValues>;
  idPrefix: string;
  isBusy: boolean;
  t: (key: string) => string;
}>;

export function SeoStructuredDataFields({
  control,
  idPrefix,
  isBusy,
  t,
}: SeoStructuredDataFieldsProps) {
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
      <FormGrid>
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
              help={t("studio.seoForm.indexing.structuredData.entityType.help")}
              value={field.value}
              onChange={field.onChange}
              disabled={isBusy || !structuredDataEnabled}
              items={entityTypes.map((value) => ({
                value,
                label: t(
                  `studio.seoForm.indexing.structuredData.entityType.options.${value}`,
                ),
              }))}
            />
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
      </FormGrid>

      {structuredDataEnabled ? (
        <>
          <FormGrid>
            {(["name", "telephone"] as const).map((name) => (
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
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isBusy}
                  />
                )}
              />
            ))}
          </FormGrid>

          <FormGrid>
            <Controller
              name="structuredData.email"
              control={control}
              render={({ field }) => (
                <InputField
                  ids={createFieldIds(idPrefix, "structuredData.email")}
                  name={field.name}
                  label={t(
                    "studio.seoForm.indexing.structuredData.email.label",
                  )}
                  help={t("studio.seoForm.indexing.structuredData.email.help")}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isBusy}
                />
              )}
            />

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
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  rows={4}
                  disabled={isBusy}
                />
              )}
            />
          </FormGrid>

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
                        value={field.value ?? ""}
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
                    value={field.value ?? ""}
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
        </>
      ) : null}
    </div>
  );
}

SeoStructuredDataFields.displayName = "SeoStructuredDataFields";
