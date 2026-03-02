/**
 * @file apps/studio/src/app/[locale]/dashboard/(pages)/pages/[pageId]/blocks/[blockId]/page.tsx
 * @layer app/studio
 *
 * @description
 * Page admin — édition d’un block d’une page.
 *
 * @remarks
 * - Route : /[locale]/dashboard/pages/[pageId]/blocks/[blockId]
 * - Server Component : validation d’existence de la page en draft.
 * - Délègue lecture/mutations du block à la Section (client) via React Query.
 */

import { notFound } from "next/navigation";

import { PageBlockEditSection } from "@compoz/studio/features/pages/sections/PageBlockEditSection";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getPagesRepository } from "@compoz/infra/pages";

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
  const { pageId, blockId } = await unwrapParams(params);

  if (!pageId || !blockId) notFound();

  const pagesRepo = getPagesRepository();

  // ✅ On valide que la page existe (draft), et on récupère le slug pour l’UI si besoin
  const page = await pagesRepo.readById(WRITE_CONTENT_STATE, pageId);
  if (!page) notFound();

  return (
    <PageBlockEditSection pageId={pageId} slug={page.slug} blockId={blockId} />
  );
}

AdminPageBlockEditPage.displayName = "AdminPageBlockEditPage";
