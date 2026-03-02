/**
 * @file packages/ui/src/lib/format-bytes.ts
 * @description
 * Formattage de taille de fichier (bytes) en Ko/Mo/Go.
 */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (bytes < mb) return `${(bytes / kb).toFixed(1)} KB`;
  if (bytes < gb) return `${(bytes / mb).toFixed(2)} MB`;

  return `${(bytes / gb).toFixed(2)} GB`;
}
