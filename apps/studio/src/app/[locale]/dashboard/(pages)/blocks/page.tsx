/**
 * @file apps/studio/src/app/[locale]/dashboard/(pages)/blocks/page.tsx
 * @layer app/studio/pages
 *
 * @description
 * Page « Blocs » (admin) — affiche la section Blocs.
 * Utilisé pour le routing.
 */

import { BlocksPage } from "@compoz/studio/features/pages/blocks/BlocksPage";

export default function AdminBlocksPage() {
  return <BlocksPage />;
}

AdminBlocksPage.displayName = "AdminBlocksPage";
