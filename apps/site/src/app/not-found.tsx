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
import { SiteRuntimeProvider } from "@compoz/ui/site/providers/SiteRuntimeProvider";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

export default function SiteNotFound() {
  const ui = resolveSiteUi();

  return (
    <SiteRuntimeProvider ui={ui} theme={null}>
      <SiteNotFoundClient />
    </SiteRuntimeProvider>
  );
}

SiteNotFound.displayName = "SiteNotFound";
