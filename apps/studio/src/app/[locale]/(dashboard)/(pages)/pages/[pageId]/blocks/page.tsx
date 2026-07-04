/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/[pageId]/blocks/page.tsx
 * @layer studio/app
 *
 * @description
 * Page “Blocks” d’une page dans le Dashboard Studio.
 *
 * @remarks
 * - Route : `/[locale]/pages/[pageId]/blocks`.
 * - Server Component : charge la page par id en draft.
 * - Résout la session Studio et le Website actif côté server.
 * - Le repository est instancié avec le Prisma Website.id actif.
 * - Délègue la logique client (query/mutations + action bar) au container.
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
