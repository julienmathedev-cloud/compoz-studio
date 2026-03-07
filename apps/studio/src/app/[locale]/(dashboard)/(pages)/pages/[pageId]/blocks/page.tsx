/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/[pageId]/blocks/page.tsx
 * @layer studio/app
 *
 * @description
 * Page “Blocks” d’une page (Dashboard Studio) — V0.5.
 *
 * @remarks
 * - Route : /[locale]/pages/[pageId]/blocks
 * - Server Component : charge la page par id (draft).
 * - ✅ Multi-tenant : repo instancié avec `tenantId` depuis la session.
 * - Délègue la logique (query/mutations + action bar) au container.
 */

import { notFound } from "next/navigation";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getPagesRepository } from "@compoz/infra/pages";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
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
  const { tenantId } = await requireSessionWithTenant();
  if (!tenantId) notFound();

  const { pageId } = await unwrapParams(params);
  if (!pageId) notFound();

  const pagesRepo = getPagesRepository({ tenantId });

  // Fetch par ID directement (draft-only)
  const page = await pagesRepo.readById(DEFAULT_CONTENT_STATE, pageId);
  if (!page) notFound();

  return <PageBlocksListPage pageId={pageId} slug={page.slug} />;
}

StudioPageBlocksPage.displayName = "StudioPageBlocksPage";
