/**
 * @file apps/site/src/app/not-found.tsx
 * @layer site/app
 *
 * @description
 * Page 404 pour le segment site (Server Component).
 *
 * @remarks
 * - `not-found.tsx` doit rester server (pas de "use client").
 * - Le rendu UI dynamique (pathname/searchParams) est délégué à un composant client.
 */

import { SiteNotFoundClient } from "@compoz/site/components/system/SiteNotFoundClient";

export default function SiteNotFound() {
  return <SiteNotFoundClient />;
}

SiteNotFound.displayName = "SiteNotFound";
