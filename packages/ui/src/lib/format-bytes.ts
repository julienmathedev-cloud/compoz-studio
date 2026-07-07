/**
 * @file packages/ui/src/lib/format-bytes.ts
 * @layer ui/lib/format
 * @description Formats byte sizes into UI-friendly B, KB, MB, or GB labels.
 * @remarks
 * Uses a 1024 base while keeping decimal labels for display.
 */
export function formatBytes(bytes: number): string {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;

  if (value < 1024) return `${value} B`;

  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (value < mb) return `${(value / kb).toFixed(1)} KB`;
  if (value < gb) return `${(value / mb).toFixed(2)} MB`;

  return `${(value / gb).toFixed(2)} GB`;
}
