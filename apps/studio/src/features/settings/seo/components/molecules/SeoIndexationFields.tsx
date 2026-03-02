/**
 * @file apps/studio/src/features/settings/seo/components/molecules/OpenGraphFields.tsx
 * @layer ui/molecule
 * @description Composant de champs d’indexation SEO pour le formulaire d’administration.
 * @remarks Inclut les contrôles pour baseUrl, canonicalUrl, robots et structuredDataEnabled avec gestion RHF.
 */
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";
import { HelperChips } from "@compoz/studio/components/molecules/controls/HelperChips";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";

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

  // Normalisation
  const parts = prev
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const lower = parts.map((p) => p.toLowerCase());
  const tLower = t.toLowerCase();

  // Relations exclusives
  const EXCLUSIVE_MAP: Record<string, string> = {
    index: "noindex",
    noindex: "index",
    follow: "nofollow",
    nofollow: "follow",
  };

  const opposite = EXCLUSIVE_MAP[tLower];

  // 1️⃣ Si déjà présent → on retire (toggle off)
  const alreadyIndex = lower.findIndex((p) => p === tLower);
  if (alreadyIndex >= 0) {
    const next = parts
      .slice(0, alreadyIndex)
      .concat(parts.slice(alreadyIndex + 1));
    return next.join(",");
  }

  // 2️⃣ Supprime l'opposé si présent
  let nextParts = parts;
  if (opposite) {
    nextParts = parts.filter((p) => p.toLowerCase() !== opposite);
  }

  // 3️⃣ Ajoute le token
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
  const structuredDataIds = createFieldIds(idPrefix, "structuredDataEnabled");

  return (
    <div className={cn(STACK_MD)}>
      <Controller
        name="baseUrl"
        control={control}
        render={({ field }) => (
          <InputField
            ids={baseUrlIds}
            label={t("admin.seoForm.indexing.baseUrl.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            placeholder={t("admin.seoForm.indexing.baseUrl.placeholder")}
            help={t("admin.seoForm.indexing.baseUrl.help")}
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
            label={t("admin.seoForm.indexing.canonicalUrl.label")}
            value={field.value ?? ""}
            onChange={(v) => field.onChange(v)}
            placeholder={t("admin.seoForm.indexing.canonicalUrl.placeholder")}
            help={t("admin.seoForm.indexing.canonicalUrl.help")}
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
              label={t("admin.seoForm.indexing.robots.label")}
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              placeholder={t("admin.seoForm.indexing.robots.placeholder")}
              help={t("admin.seoForm.indexing.robots.help")}
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
        name="structuredDataEnabled"
        control={control}
        render={({ field }) => (
          <SwitchField
            ids={structuredDataIds}
            label={t("admin.seoForm.indexing.structuredData.label")}
            help={t("admin.seoForm.indexing.structuredData.help")}
            checked={Boolean(field.value)}
            onCheckedChange={(v) => field.onChange(v === true)}
            disabled={isBusy}
          />
        )}
      />
    </div>
  );
}

SeoIndexationFields.displayName = "SeoIndexationFields";
