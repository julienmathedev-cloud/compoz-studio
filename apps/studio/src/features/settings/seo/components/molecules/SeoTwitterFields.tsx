"use client";

/**
 * @file apps/studio/src/features/settings/seo/components/molecules/SeoTwitterFields.tsx
 * @layer studio/features/settings/seo/components/molecules
 *
 * @description
 * Twitter SEO fields for card type, site handle, and creator handle.
 *
 * @remarks
 * - Uses a fallback card value when the nested Twitter form slice is not initialized yet.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";

import { TWITTER_CARD_TYPES } from "@compoz/core/constants/seo/seo";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type {
  SeoFormValues,
  SeoTwitterFormValues,
} from "@compoz/validation/site/settings/seo/seo-form";

type SeoTwitterFieldsProps = Readonly<{
  control: Control<SeoFormValues>;
  idPrefix: string;
  isBusy?: boolean;
  fallbackCard: string;
  t: (key: string) => string;
}>;

export function SeoTwitterFields({
  control,
  idPrefix,
  isBusy,
  fallbackCard,
  t,
}: SeoTwitterFieldsProps) {
  const twitterCardItems = TWITTER_CARD_TYPES.map((card) => ({
    value: card,
    label: card,
  }));

  const twitterCardIds = createFieldIds(idPrefix, "twitterCard");
  const twitterSiteIds = createFieldIds(idPrefix, "twitterSite");
  const twitterCreatorIds = createFieldIds(idPrefix, "twitterCreator");

  return (
    <Controller
      name="twitter"
      control={control}
      render={({ field }) => {
        const twitter = (field.value ?? {
          card: fallbackCard,
        }) as SeoTwitterFormValues;
        const card = twitter.card ?? fallbackCard;

        return (
          <div className={cn(STACK_MD)}>
            <SelectField
              ids={twitterCardIds}
              name="twitter.card"
              label={t("studio.seoForm.twitter.card.label")}
              value={card}
              onChange={(v) =>
                field.onChange({
                  ...twitter,
                  card: v as SeoTwitterFormValues["card"],
                })
              }
              items={twitterCardItems}
              placeholder={t("studio.seoForm.twitter.card.placeholder")}
              help={t("studio.seoForm.twitter.card.help")}
              disabled={isBusy}
            />

            <InputField
              ids={twitterSiteIds}
              name="twitter.site"
              label={t("studio.seoForm.twitter.site.label")}
              value={twitter.site ?? ""}
              onChange={(v) =>
                field.onChange({ ...twitter, site: v || undefined })
              }
              placeholder={t("studio.seoForm.twitter.site.placeholder")}
              help={t("studio.seoForm.twitter.site.help")}
              disabled={isBusy}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />

            <InputField
              ids={twitterCreatorIds}
              name="twitter.creator"
              label={t("studio.seoForm.twitter.creator.label")}
              value={twitter.creator ?? ""}
              onChange={(v) =>
                field.onChange({ ...twitter, creator: v || undefined })
              }
              placeholder={t("studio.seoForm.twitter.creator.placeholder")}
              help={t("studio.seoForm.twitter.creator.help")}
              disabled={isBusy}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        );
      }}
    />
  );
}

SeoTwitterFields.displayName = "SeoTwitterFields";
