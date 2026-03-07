/**
 * @file apps/studio/src/app/[locale]/(dashboard)/[...not_found]/page.tsx
 * @layer studio/app
 *
 * @description
 * Catch-all du dashboard localisé.
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
