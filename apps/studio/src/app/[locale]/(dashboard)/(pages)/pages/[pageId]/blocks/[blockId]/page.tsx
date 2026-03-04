/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/[pageId]/blocks/[blockId]/page.tsx
 * @layer app/studio
 */

import { notFound } from "next/navigation";

import { PageBlockEditSection } from "@compoz/studio/features/pages/sections/PageBlockEditSection";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getPagesRepository } from "@compoz/infra/pages";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";

import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type AdminPageBlockEditPageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
      pageId: string;
      blockId: string;
    }>
  >;
}>;

export default async function AdminPageBlockEditPage({
  params,
}: AdminPageBlockEditPageProps) {
  const { tenantId } = await requireSessionWithTenant();

  const { pageId, blockId } = await unwrapParams(params);
  if (!pageId || !blockId) notFound();

  const pagesRepo = getPagesRepository({ tenantId });

  const page = await pagesRepo.readById(WRITE_CONTENT_STATE, pageId);
  if (!page) notFound();

  return (
    <PageBlockEditSection pageId={pageId} slug={page.slug} blockId={blockId} />
  );
}

AdminPageBlockEditPage.displayName = "AdminPageBlockEditPage";
