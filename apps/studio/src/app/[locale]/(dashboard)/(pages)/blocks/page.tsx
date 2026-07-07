/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/blocks/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio "Blocks" route segment that renders the Blocks section.
 */

import { BlocksPage } from "@compoz/studio/features/pages/blocks/BlocksPage";

export default function StudioBlocksPage() {
  return <BlocksPage />;
}

StudioBlocksPage.displayName = "StudioBlocksPage";
