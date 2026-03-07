/**
 * @file apps/studio/src/app/preview/empty/page.tsx
 * @layer studio/app
 *
 * @description
 * Page de preview “empty” (SSR-safe) : rend un empty state déterministe.
 *
 * @remarks
 * - Pas de "use client" ici.
 * - Lit `searchParams.label` côté server pour éviter tout mismatch d’hydratation.
 */

import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";

type PreviewEmptyPageProps = Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstSearchParam(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PreviewEmptyPage({
  searchParams,
}: PreviewEmptyPageProps) {
  const sp = (await searchParams) ?? {};

  const label = firstSearchParam(sp.label);

  const text =
    (label ?? "").trim() || "Aucune donnée à visualiser pour cet aperçu.";

  return <EmptyState text={text} className="h-full" />;
}

PreviewEmptyPage.displayName = "PreviewEmptyPage";
