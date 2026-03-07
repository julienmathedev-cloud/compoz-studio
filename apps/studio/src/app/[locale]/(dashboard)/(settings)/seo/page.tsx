/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(settings)/seo/page.tsx
 * @layer studio/app
 *
 * @description
 * Page « SEO » (Studio) — route du dashboard.
 */

import { SeoPage } from "@compoz/studio/features/settings/seo/SeoPage";

export default function StudioSeoPage() {
  return <SeoPage />;
}

StudioSeoPage.displayName = "StudioSeoPage";
