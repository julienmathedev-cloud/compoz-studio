/**
 * @file apps/studio/src/app/[locale]/(dashboard)/page.tsx
 * @layer studio/app
 *
 * @description
 * Page principale du Dashboard Studio.
 *
 * @remarks
 * - Point d’entrée du dashboard.
 * - Le paramètre `?tab=` (si utilisé) est géré par le module `OverviewPage`
 *   (synchronisation onglet ↔ URL).
 */

import { OverviewPage } from "@compoz/studio/features/overview/pages/OverviewPage";

export default function StudioOverviewPage() {
  return <OverviewPage />;
}
