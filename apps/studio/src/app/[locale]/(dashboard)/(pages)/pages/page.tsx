/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/page.tsx
 * @layer studio/app
 *
 * @description
 * Page “Pages” (Dashboard Studio) — V0.5.
 *
 * @remarks
 * - Route : /[locale]/pages
 * - Délègue l’interactivité (client) au composant `PagesPage`.
 */

import { PagesPage } from "@compoz/studio/features/pages/pages/PagesPage";

export default function StudioPagesPage() {
  return <PagesPage />;
}

StudioPagesPage.displayName = "StudioPagesPage";
