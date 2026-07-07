/**
 * @file apps/studio/src/app/preview/empty/page.tsx
 * @layer studio/app
 *
 * @description
 * SSR-safe empty preview page that renders a deterministic empty state.
 *
 * @remarks
 * - No `"use client"` directive here.
 * - Reads `searchParams.label` on the server to avoid hydration mismatches.
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
