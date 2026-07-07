/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(settings)/identity/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio Dashboard route that delegates identity settings to `IdentityPage`.
 */

import { IdentityPage } from "@compoz/studio/features/settings/identity/IdentityPage";

export default function StudioIdentityPage() {
  return <IdentityPage />;
}

StudioIdentityPage.displayName = "StudioIdentityPage";
