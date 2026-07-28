/**
 * @file packages/core/src/domain/site/use-cases/theme/update-theme-settings.ts
 * @layer core/domain/site/use-cases/theme
 * @description Applies a revisioned, field-level three-way merge to theme settings.
 * @remarks Light and dark token sets are atomic composites compared structurally; the merged result uses the business validator before CAS.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";
import type {
  UpdateThemeSettingsDeps,
  UpdateThemeSettingsInput,
  UpdateThemeSettingsResult,
} from "@compoz/core/domain/site/use-cases/theme/update-theme-settings.types";
import { assertThemeSettings } from "@compoz/core/domain/site/validators/theme";

const THEME_FIELDS = [
  "enableDarkMode",
  "mode",
  "fontFamily",
  "headingFont",
  "revealPreset",
  "lightTokens",
  "darkTokens",
] as const;
const STRUCTURAL_THEME_FIELDS = new Set<string>(["lightTokens", "darkTokens"]);
export function updateThemeSettings({ repo }: UpdateThemeSettingsDeps) {
  return (input: UpdateThemeSettingsInput): Promise<UpdateThemeSettingsResult> =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "theme",
      fields: THEME_FIELDS,
      readCurrent: async () => {
        const bundle = await repo.readSettingsWithRevisions(
          DEFAULT_CONTENT_STATE,
        );

        return {
          settings: bundle.settings.theme,
          revision: bundle.revisions.themeRevision,
        };
      },
      compareAndSet: (expectedRevision, theme) =>
        repo.compareAndSetDraftTheme({
          expectedRevision,
          theme,
        }),
      equals: (field, left, right) =>
        STRUCTURAL_THEME_FIELDS.has(field)
          ? equalJsonValue(left, right)
          : Object.is(left, right),
      validate: assertThemeSettings,
    });
}
