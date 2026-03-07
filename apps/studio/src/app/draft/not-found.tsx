/**
 * @file apps/studio/src/app/draft/not-found.tsx
 * @layer studio/app
 *
 * @description
 * Page 404 pour la route "/draft" (preview DRAFT dans l’app Studio).
 *
 * @remarks
 * - `not-found.tsx` doit rester server (pas de "use client").
 * - Le rendu UI dynamique (pathname/searchParams) est délégué à un composant client.
 * - Convention V0.5 : draft preview = "/draft".
 */

import { StudioNotFoundClient } from "@compoz/studio/components/not-found/StudioNotFoundClient";

export default function DraftNotFound() {
  return <StudioNotFoundClient />;
}

DraftNotFound.displayName = "DraftNotFound";
