/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(settings)/theme/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio Dashboard route that delegates theme settings to `ThemePage`.
 */

import { ThemePage } from "@compoz/studio/features/settings/theme/ThemePage";

export default function StudioThemePage() {
  return <ThemePage />;
}

StudioThemePage.displayName = "StudioThemePage";
