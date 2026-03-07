/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(pages)/pages/[pageId]/blocks/[blockId]/page.tsx
 * @layer studio/app
 *
 * @description
 * Page d’édition d’un bloc d’une page (Dashboard Studio).
 *
 * @remarks
 * - Résout le tenant via la session.
 * - Charge la page (state par défaut) puis rend la section d’édition du bloc.
 * - 404 si `pageId`/`blockId` manquants ou page introuvable.
 */

import { notFound } from "next/navigation";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getPagesRepository } from "@compoz/infra/pages";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
import { PageBlockEditSection } from "@compoz/studio/features/pages/sections/PageBlockEditSection";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type StudioPageBlockEditPageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
      pageId: string;
      blockId: string;
    }>
  >;
}>;

export default async function StudioPageBlockEditPage({
  params,
}: StudioPageBlockEditPageProps) {
  const { tenantId } = await requireSessionWithTenant();
  if (!tenantId) notFound();

  const { pageId, blockId } = await unwrapParams(params);
  if (!pageId || !blockId) notFound();

  const pagesRepo = getPagesRepository({ tenantId });

  const page = await pagesRepo.readById(DEFAULT_CONTENT_STATE, pageId);
  if (!page) notFound();

  return (
    <PageBlockEditSection pageId={pageId} slug={page.slug} blockId={blockId} />
  );
}

StudioPageBlockEditPage.displayName = "StudioPageBlockEditPage";
