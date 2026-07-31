/**
 * @file packages/core/src/domain/site/ports/draft-site-settings-initializer.ts
 * @layer core/domain/site/ports
 * @description Provisioning-only boundary for initializing the complete Draft settings aggregate.
 */

import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";

export interface DraftSiteSettingsInitializer {
  initializeDraftSettings(settings: Readonly<SiteSettings>): Promise<void>;
}
