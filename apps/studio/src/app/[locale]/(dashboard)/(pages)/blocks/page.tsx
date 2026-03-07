/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/blocks/page.tsx
 * @layer studio/app
 *
 * @description
 * Page « Blocs » (Studio) — route segment qui rend la section Blocs.
 */

import { BlocksPage } from "@compoz/studio/features/pages/blocks/BlocksPage";

export default function StudioBlocksPage() {
  return <BlocksPage />;
}

StudioBlocksPage.displayName = "StudioBlocksPage";
