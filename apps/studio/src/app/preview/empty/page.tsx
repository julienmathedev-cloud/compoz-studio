/**
 * @file apps/studio/src/app/preview/empty/page.tsx
 * @layer app/preview
 *
 * @description
 * Page de preview “empty” (SSR-safe) : rend un empty state déterministe.
 *
 * ⚠️ Important:
 * - Pas de "use client" ici
 * - On lit `searchParams.label` pour éviter tout mismatch d’hydratation.
 */
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";

type PreviewEmptyPageProps = Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function PreviewEmptyPage({
  searchParams,
}: PreviewEmptyPageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.label;

  const label = Array.isArray(raw) ? raw[0] : raw;

  const text =
    (label ?? "").trim() || "Aucune donnée à visualiser pour cet aperçu.";

  return <EmptyState text={text} className="h-full" />;
}

PreviewEmptyPage.displayName = "PreviewEmptyPage";
