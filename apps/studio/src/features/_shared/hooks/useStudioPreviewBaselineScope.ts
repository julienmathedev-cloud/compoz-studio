"use client";

/**
 * @file apps/studio/src/features/_shared/hooks/useStudioPreviewBaselineScope.ts
 * @layer studio/features/_shared/hooks
 *
 * @description
 * Shared hook for injecting a preview baseline once its scope handshake is ready.
 *
 * @remarks
 * - Avoids duplicating the guarded baseline injection pattern across preview sections.
 * - Preserves the section model where each preview scope owns a dedicated effect.
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
