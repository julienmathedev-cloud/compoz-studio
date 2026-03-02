/**
 * @file apps/site/src/app/not-found.tsx
 * @layer app/site
 *
 * @description
 * Page 404 pour le segment public (Server Component).
 *
 * @remarks
 * - `not-found.tsx` doit rester server (pas de "use client").
 * - Le rendu UI dynamique (pathname/searchParams) est délégué à un composant client.
 */

import { PublicNotFoundClient } from "@compoz/site/components/system/PublicNotFoundClient";

export default function PublicNotFound() {
  return <PublicNotFoundClient />;
}

PublicNotFound.displayName = "PublicNotFound";
