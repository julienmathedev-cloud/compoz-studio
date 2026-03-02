/**
 * @file apps/studio/src/app/[locale]/page.tsx
 * @layer app/studio
 *
 * @description
 * Page d’accès (gate) traduisible : entrée de Compoz par locale.
 *
 * @remarks
 * - Propose un accès au site public et à l’admin.
 * - V0.5 : le public reste sous `/site` (non localisé).
 */

import Link from "next/link";

import { getTranslations } from "next-intl/server";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import {
  ADMIN_CONTAINER,
  ADMIN_PAGE,
  ROW_END,
} from "@compoz/ui/styles/studio/layout";

type LocaleGatePageProps = Readonly<{
  params: Promise<
    Readonly<{
      locale: string;
    }>
  >;
}>;

export default async function LocaleGatePage({ params }: LocaleGatePageProps) {
  const { locale } = await unwrapParams(params);

  const t = await getTranslations({ locale });

  return (
    <main className={cn("min-h-dvh", ADMIN_CONTAINER, ADMIN_PAGE)}>
      <section
        aria-label={t("gate.ariaLabel")}
        className={cn("flex flex-1 mx-auto items-center justify-center")}
      >
        <Card variant="panel" className={cn("w-[420px]")}>
          <CardContent className={cn("space-y-8")}>
            <Heading as="h1" className="text-center">
              {t("gate.title")}
            </Heading>

            <Text variant="muted" className="text-center">
              {t("gate.tagline")}
            </Text>

            <div className={cn(ROW_END, "flex-wrap gap-2 justify-between")}>
              <Button asChild type="button" variant="ghost">
                <Link href="/site">{t("gate.actions.public")}</Link>
              </Button>

              <Button asChild type="button">
                <Link href={`/${locale}/dashboard`}>
                  {t("gate.actions.admin")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
