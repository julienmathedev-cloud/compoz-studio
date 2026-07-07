/****
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio Dashboard route that delegates page management to `PagesPage`.
 */

import { PagesPage } from "@compoz/studio/features/pages/pages/PagesPage";

export default function StudioPagesPage() {
  return <PagesPage />;
}

StudioPagesPage.displayName = "StudioPagesPage";
