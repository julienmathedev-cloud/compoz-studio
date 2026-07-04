/**
 * @file apps/studio/src/app/[locale]/(builder)/pages/[pageId]/builder/[blockId]/page.tsx
 * @layer studio/app
 *
 * @description
 * Page builder d’un bloc d’une page dans le Builder Studio.
 *
 * @remarks
 * - Résout la session Studio et le Website actif côté server.
 * - Charge la page depuis le scope du Prisma Website.id actif.
 * - Retrouve le block ciblé puis rend l’écran builder.
 * - Retourne une 404 si `pageId` / `blockId` sont manquants,
 *   si la page est introuvable ou si le block est introuvable / incompatible.
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
