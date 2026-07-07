/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(settings)/social/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio Dashboard route that delegates social settings to `SocialPage`.
 */

import { SocialPage } from "@compoz/studio/features/settings/social/SocialPage";

export default function StudioSocialPage() {
  return <SocialPage />;
}

StudioSocialPage.displayName = "StudioSocialPage";
