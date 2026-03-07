/**
 * @file apps/studio/src/features/pages/pages/PageBlocksListPage.tsx
 * @layer ui/studio/pages
 *
 * @description
 * Page « Blocs » (studio) — affiche la section listant les blocs d’une page.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { PageBlocksListSection } from "@compoz/studio/features/pages/sections/PageBlocksListSection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

type PageBlocksListPageProps = Readonly<{
  pageId: string;
  slug: string;
}>;

/**
 * Page listant les blocs d’une page (studio).
 */
export function PageBlocksListPage({ pageId, slug }: PageBlocksListPageProps) {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.blocks")}
      </Heading>

      <PageBlocksListSection pageId={pageId} slug={slug} />
    </div>
  );
}

PageBlocksListPage.displayName = "PageBlocksListPage";
