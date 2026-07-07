/**
 * @file apps/studio/src/features/pages/pages/PageBlocksListPage.tsx
 * @layer studio/features/pages/pages
 *
 * @description
 * Studio page shell for listing the blocks of a single page.
 *
 * @remarks
 * - Keeps a unique screen-reader-only H1 while `PageBlocksListSection` renders the visible section heading.
 * - Passes the resolved page id and slug down to the section; data loading stays in the section/hooks layer.
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
