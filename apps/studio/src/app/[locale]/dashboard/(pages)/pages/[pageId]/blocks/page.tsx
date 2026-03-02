/**
 * @file apps/studio/src/app/[locale]/dashboard/(pages)/pages/[pageId]/blocks/page.tsx
 * @layer app/studio
 *
 * @description
 * Page admin “Blocks” d’une page (V0.5).
 *
 * @remarks
 * - Route : /[locale]/dashboard/pages/[pageId]/blocks
 * - Server Component : résolution slug -> pageId via index (draft).
 * - Délègue la logique (query/mutations + action bar) au container.
 */

import { notFound } from "next/navigation";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";

import { getPagesRepository } from "@compoz/infra/pages";
import { PageBlocksListPage } from "@compoz/studio/features/pages/pages/PageBlocksListPage";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type PageParams = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
      pageId: string;
    }>
  >;
}>;

export default async function AdminPageBlocks({ params }: PageParams) {
  const { pageId } = await unwrapParams(params);

  if (!pageId) notFound();

  const pagesRepo = getPagesRepository();

  // fetch par ID DIRECTEMENT
  const page = await pagesRepo.readById(WRITE_CONTENT_STATE, pageId);

  if (!page) notFound();

  return <PageBlocksListPage pageId={pageId} slug={page.slug} />;
}

AdminPageBlocks.displayName = "AdminPageBlocks";
