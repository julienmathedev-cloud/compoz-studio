/**
 * @file apps/studio/src/app/[locale]/(dashboard)/[...not_found]/page.tsx
 * @layer studio/app
 *
 * @description
 * Catch-all route for unknown localized dashboard paths.
 *
 * @remarks
 * - Forces `src/app/[locale]/not-found.tsx` for every unknown route under
 *   `/{locale}/...`.
 */

import { notFound } from "next/navigation";

export default function LocaleCatchAllNotFound() {
  notFound();
}
