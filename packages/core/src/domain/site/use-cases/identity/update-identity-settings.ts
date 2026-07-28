/**
 * @file packages/core/src/domain/site/use-cases/identity/update-identity-settings.ts
 * @layer core/domain/site/use-cases/identity
 * @description Applies a revisioned, field-level three-way merge to identity settings.
 * @remarks The logo is an atomic composite value compared structurally before the identity CAS.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateIdentitySettingsDeps,
  UpdateIdentitySettingsInput,
  UpdateIdentitySettingsResult,
} from "@compoz/core/domain/site/use-cases/identity/update-identity-settings.types";

const IDENTITY_FIELDS = [
  "siteName",
  "tagline",
  "logo",
  "faviconUrl",
  "faviconMediaAssetId",
] as const;
const STRUCTURAL_IDENTITY_FIELDS = new Set<string>(["logo"]);

export function updateIdentitySettings({ repo }: UpdateIdentitySettingsDeps) {
  return (
    input: UpdateIdentitySettingsInput,
  ): Promise<UpdateIdentitySettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "identity",
      fields: IDENTITY_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.identity,
          revision: bundle.revisions.identityRevision,
        };
      },
      compareAndSet: (expectedRevision, identity) =>
        repo.compareAndSetDraftIdentity({
          expectedRevision,
          identity,
        }),
      equals: (field, left, right) =>
        STRUCTURAL_IDENTITY_FIELDS.has(field)
          ? equalJsonValue(left, right)
          : Object.is(left, right),
    });
}
