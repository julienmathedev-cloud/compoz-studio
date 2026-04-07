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

import { getServerSession } from "next-auth";

import { authOptions } from "@compoz/studio/auth/auth";
import { OverviewPage } from "@compoz/studio/features/overview/pages/OverviewPage";

export default async function StudioOverviewPage() {
  const session = await getServerSession(authOptions);
  const isDemo = session?.user?.isDemo === true;

  return <OverviewPage isDemo={isDemo} />;
}
