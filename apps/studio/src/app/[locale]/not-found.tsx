/**
 * @file apps/studio/src/app/[locale]/not-found.tsx
 * @layer app/not-found
 *
 * @description
 * Page 404 du scope localisé.
 *
 * @remarks
 * - S’affiche quand une route `/{locale}/...` n’existe pas.
 * - V0.5 : la locale sert surtout de porte d’entrée (gate) + admin.
 * - Propose une action de retour vers la gate `/{locale}`.
 */

import Link from "next/link";

import { getTranslations } from "next-intl/server";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import {
  ADMIN_CONTAINER,
  ADMIN_PAGE,
  ADMIN_SECTION,
  ROW_END,
} from "@compoz/ui/styles/studio/layout";

export default async function LocaleNotFound() {
  const t = await getTranslations();
  return (
    <main className={cn("min-h-dvh", ADMIN_CONTAINER, ADMIN_PAGE)}>
      <Heading as="h1" className="sr-only">
        {t("admin.pages.notFound.title")}
      </Heading>
      <section
        aria-label={t("admin.pages.notFound.title")}
        className={cn(ADMIN_SECTION, "flex-1 justify-center items-center")}
      >
        <Card variant="panel" className={cn("w-[420px]")}>
          <CardContent className={cn("space-y-8")}>
            <Heading as="h2" className="text-center">
              {t("admin.pages.notFound.title")}
            </Heading>

            <Text variant="muted" className="text-center">
              {t("admin.pages.notFound.description")}
            </Text>

            <div className={cn(ROW_END, "justify-center")}>
              <Button asChild type="button">
                <Link href={`/`}>{t("admin.pages.error.backToAdmin")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
