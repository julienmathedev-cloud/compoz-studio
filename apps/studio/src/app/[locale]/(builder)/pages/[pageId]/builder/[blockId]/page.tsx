/**
 * @file apps/studio/src/app/[locale]/(builder)/pages/[pageId]/builder/[blockId]/page.tsx
 * @layer studio/app
 *
 * @description
 * Builder page for editing one block of one page in the Studio Builder.
 *
 * @remarks
 * - Resolves the Studio session and active Website server-side.
 * - Loads the page within the active Prisma Website.id scope.
 * - Finds the targeted block before rendering the builder screen.
 * - Returns 404 when `pageId` / `blockId` are missing, the page is not found,
 *   or the block is missing or incompatible.
 */

import { notFound } from "next/navigation";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getPagesRepository } from "@compoz/infra/pages";
import {
  isAdminRole,
  requireSessionWithWebsite,
} from "@compoz/studio/auth/require-session";
import { BuilderScreen } from "@compoz/studio/features/builder/BuilderScreen";
import { toSectionBlockFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/blocks-form";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type BuilderPageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
      pageId: string;
      blockId: string;
    }>
  >;
}>;

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { websiteId, role } = await requireSessionWithWebsite();

  if (!websiteId) {
    notFound();
  }

  const isAdmin = isAdminRole(role);

  const { pageId, blockId } = await unwrapParams(params);

  if (!pageId || !blockId) {
    notFound();
  }

  const pagesRepo = getPagesRepository({ websiteId });
  const page = await pagesRepo.readById(DEFAULT_CONTENT_STATE, pageId);

  if (!page) {
    notFound();
  }

  const block = (page.blocks ?? []).find((item) => item.id === blockId);

  if (!block || block.type !== "section") {
    notFound();
  }

  const initialValues = toSectionBlockFormValuesFromDTO(block);

  return (
    <BuilderScreen
      pageId={pageId}
      pageSlug={page.slug}
      blockId={blockId}
      initialValues={initialValues}
      isAdmin={isAdmin}
    />
  );
}

BuilderPage.displayName = "BuilderPage";
