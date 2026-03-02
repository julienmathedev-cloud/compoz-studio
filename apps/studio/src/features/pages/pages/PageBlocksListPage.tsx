/**
 * @file apps/studio/src/features/pages/pages/PageBlocksListPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Blocs » (admin) — affiche la section Blocs.
 */

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { PageBlocksListSection } from "@compoz/studio/features/pages/sections/PageBlocksListSection";
import { useTranslations } from "next-intl";

type PageBlockPageProps = Readonly<{
  pageId: string;
  slug: string;
}>;

/**
 * Page Blocs Liste : affiche la liste des Blocs d'une page.
 */
export function PageBlocksListPage({ pageId, slug }: PageBlockPageProps) {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.blocks")}
      </Heading>

      <PageBlocksListSection pageId={pageId} slug={slug} />
    </div>
  );
}

PageBlocksListPage.displayName = "PageBlocksListPage";
