/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/[pageId]/blocks/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio Dashboard page for editing the blocks of a draft page.
 *
 * @remarks
 * - Loads the draft page by ID from the active Prisma Website scope.
 * - Delegates client logic such as queries, mutations, and the action bar to the container.
 */

import { notFound } from "next/navigation";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getPagesRepository } from "@compoz/infra/pages";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { PageBlocksListPage } from "@compoz/studio/features/pages/pages/PageBlocksListPage";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type StudioPageBlocksPageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
      pageId: string;
    }>
  >;
}>;

export default async function StudioPageBlocksPage({
  params,
}: StudioPageBlocksPageProps) {
  const { websiteId } = await requireSessionWithWebsite();

  if (!websiteId) {
    notFound();
  }

  const { pageId } = await unwrapParams(params);

  if (!pageId) {
    notFound();
  }

  const pagesRepo = getPagesRepository({ websiteId });

  const page = await pagesRepo.readById(DEFAULT_CONTENT_STATE, pageId);

  if (!page) {
    notFound();
  }

  return <PageBlocksListPage pageId={pageId} slug={page.slug} />;
}

StudioPageBlocksPage.displayName = "StudioPageBlocksPage";
