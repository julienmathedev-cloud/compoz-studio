/**
 * @file packages/core/src/domain/site/use-cases/seo/update-seo-settings.ts
 * @layer core/domain/site/use-cases/seo
 * @description Applies a revisioned, field-level three-way merge to SEO settings.
 * @remarks Open Graph, Twitter and structured-data values are atomic composites compared structurally before CAS.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateSeoSettingsDeps,
  UpdateSeoSettingsInput,
  UpdateSeoSettingsResult,
} from "@compoz/core/domain/site/use-cases/seo/update-seo-settings.types";

const SEO_FIELDS = [
  "baseUrl",
  "defaultTitle",
  "titleTemplate",
  "defaultDescription",
  "canonicalUrl",
  "robots",
  "openGraph",
  "twitter",
  "structuredData",
] as const;
const STRUCTURAL_SEO_FIELDS = new Set<string>([
  "openGraph",
  "twitter",
  "structuredData",
]);
export function updateSeoSettings({ repo }: UpdateSeoSettingsDeps) {
  return (input: UpdateSeoSettingsInput): Promise<UpdateSeoSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "seo",
      fields: SEO_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.seo,
          revision: bundle.revisions.seoRevision,
        };
      },
      compareAndSet: (expectedRevision, seo) =>
        repo.compareAndSetDraftSeo({
          expectedRevision,
          seo,
        }),
      equals: (field, left, right) =>
        STRUCTURAL_SEO_FIELDS.has(field)
          ? equalJsonValue(left, right)
          : Object.is(left, right),
    });
}
