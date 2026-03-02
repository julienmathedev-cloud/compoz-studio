/**
 * @file apps/studio/src/app/[locale]/dashboard/(pages)/pages/page.tsx
 * @layer app/studio
 *
 * @description
 * Page admin “Pages” (V0.5).
 *
 * @remarks
 * - Route : /[locale]/dashboard/pages
 * - Délègue l’interactivité (client) à `PagesPage`.
 */

import { PagesPage } from "@compoz/studio/features/pages/pages/PagesPage";

export default function AdminPagesPage() {
  return <PagesPage />;
}

AdminPagesPage.displayName = "AdminPagesPage";
