/**
 * @file apps/studio/src/features/settings/seo/components/molecules/SeoIndexationFields.tsx
 * @layer studio/features/settings/seo/components/molecules
 *
 * @description
 * SEO indexation fields for base URL, canonical URL, and robots directives.
 *
 * @remarks
 * - Schema.org / JSON-LD fields stay isolated in `SeoStructuredDataFields` so the parent form can render them full-width.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";

import { HelperChips } from "@compoz/studio/components/molecules/controls/HelperChips";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

type SeoIndexationFieldsProps = Readonly<{
  control: Control<SeoFormValues>;

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

/** Toggles a robots directive while keeping mutually exclusive tokens consistent. */
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

  const alreadyIndex = lower.findIndex((p) => p === tLower);
  if (alreadyIndex >= 0) {
    const next = parts
      .slice(0, alreadyIndex)
      .concat(parts.slice(alreadyIndex + 1));

    return next.join(",");
  }

  let nextParts = parts;
  if (opposite) {
    nextParts = parts.filter((p) => p.toLowerCase() !== opposite);
  }

  return [...nextParts, t].join(",");
}

export function SeoIndexationFields({
  control,
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
    </div>
  );
}

SeoIndexationFields.displayName = "SeoIndexationFields";
