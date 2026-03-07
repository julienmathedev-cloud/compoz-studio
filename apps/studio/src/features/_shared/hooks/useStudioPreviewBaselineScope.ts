"use client";

/**
 * @file apps/studio/src/features/_shared/hooks/useStudioPreviewBaselineScope.ts
 * @layer hooks/studio/shared
 *
 * @description
 * Hook partagé pour injecter une baseline preview sur un scope donné
 * dès que le handshake du scope est prêt.
 *
 * @remarks
 * - Strictement UI-only.
 * - Évite de dupliquer le pattern :
 *   `if (baseline == null) return`
 *   `if (!ready.isReady(scope)) return`
 *   `setBaseline(scope, baseline)`
 * - Préserve la logique existante des sections : un scope = un effet dédié.
 * - Le logging reste optionnel via `debugLabel`.
 */

import { useEffect } from "react";

type PreviewReadyLike = Readonly<{
  isReady: (scope: string) => boolean;
}>;

type SetBaselineLike = <TShape>(scope: string, baseline: TShape) => void;

type UseStudioPreviewBaselineScopeParams<TShape> = Readonly<{
  scope: string;
  baseline: TShape | null | undefined;
  ready: PreviewReadyLike;
  setBaseline: SetBaselineLike;
  onInject?: () => void;
}>;

export function useStudioPreviewBaselineScope<TShape>({
  scope,
  baseline,
  ready,
  setBaseline,
  onInject,
}: UseStudioPreviewBaselineScopeParams<TShape>) {
  useEffect(() => {
    if (baseline == null) return;
    if (!ready.isReady(scope)) return;

    onInject?.();
    setBaseline<TShape>(scope, baseline);
  }, [baseline, onInject, ready, scope, setBaseline]);
}

useStudioPreviewBaselineScope.displayName = "useStudioPreviewBaselineScope";
