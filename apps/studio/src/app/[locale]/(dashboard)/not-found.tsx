/**
 * @file apps/studio/src/app/[locale]/(dashboard)/not-found.tsx
 * @layer studio/app
 *
 * @description
 * 404 page for unknown localized dashboard routes.
 *
 * @remarks
 * - Provides an action back to the localized Studio gate.
 */

import { StudioNotFound } from "@compoz/studio/components/not-found/StudioNotFound";

export default async function DashboardNotFound() {
  return <StudioNotFound />;
}
