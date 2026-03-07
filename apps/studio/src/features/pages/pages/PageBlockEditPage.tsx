/**
 * @file apps/studio/src/features/pages/pages/PageBlockEditPage.tsx
 * @layer ui/studio/pages
 *
 * @description
 * Page « Blocs » (studio) — affiche la section d’édition d’un bloc.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { PageBlockEditSection } from "@compoz/studio/features/pages/sections/PageBlockEditSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

type PageBlockEditPageProps = Readonly<{
  pageId: string;
  slug: string;
  blockId: string;
}>;

/**
 * Page d’édition d’un bloc de page (studio).
 */
export function PageBlockEditPage({
  pageId,
  slug,
  blockId,
}: PageBlockEditPageProps) {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.blocks")}
      </Heading>

      <PageBlockEditSection pageId={pageId} slug={slug} blockId={blockId} />
    </div>
  );
}

PageBlockEditPage.displayName = "PageBlockEditPage";
