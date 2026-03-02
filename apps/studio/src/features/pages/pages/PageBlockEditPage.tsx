/**
 * @file apps/studio/src/features/pages/pages/PageBlockEditPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Blocs » (admin) — affiche la section Blocs.
 */

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { useTranslations } from "next-intl";
import { PageBlockEditSection } from "@compoz/studio/features/pages/sections/PageBlockEditSection";

type PageBlockPageProps = Readonly<{
  pageId: string;
  slug: string;
  blockId: string;
}>;

/**
 * Page Blocs Edit : affiche la liste des Blocs d'une page.
 */
export function PageBlockEditPage({
  pageId,
  slug,
  blockId,
}: PageBlockPageProps) {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.blocks")}
      </Heading>

      <PageBlockEditSection pageId={pageId} slug={slug} blockId={blockId} />
    </div>
  );
}
