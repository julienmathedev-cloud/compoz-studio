/**
 * @file apps/studio/src/app/[locale]/[...not_found]/page.tsx
 * @layer app/not-found
 *
 * @description
 * Catch-all du scope localisé.
 *
 * @remarks
 * - Force l’utilisation de `src/app/[locale]/not-found.tsx`
 *   pour toute route inconnue sous `/{locale}/...`.
 * - UI-only : aucune logique métier.
 */

import { notFound } from "next/navigation";

export default function LocaleCatchAllNotFound() {
  notFound();
}
