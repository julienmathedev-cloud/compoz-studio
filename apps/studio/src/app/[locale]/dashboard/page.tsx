/**
 * @file apps/studio/src/app/[locale]/dashboard/page.tsx
 * @layer app/studio
 *
 * @description
 * Page principale de l’interface d’administration (`/admin`).
 *
 * @remarks
 * - Point d’entrée du Dashboard admin.
 * - Lit le paramètre `?tab=` pour pré-ouvrir un onglet.
 * - Le composant `Dashboard` gère la synchronisation onglet ↔ URL.
 */

import { OverviewPage } from "@compoz/studio/features/overview/pages/OverviewPage";

export default function AdminOverviewPage() {
  return <OverviewPage />;
}
