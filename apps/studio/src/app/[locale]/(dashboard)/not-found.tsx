/**
 * @file apps/studio/src/app/[locale]/(dashboard)/not-found.tsx
 * @layer app/not-found
 *
 * @description
 * Page 404 du scope localisé.
 *
 * @remarks
 * - S’affiche quand une route `/{locale}/...` n’existe pas.
 * - V0.5 : la locale sert surtout de porte d’entrée (gate) + admin.
 * - Propose une action de retour vers la gate `/{locale}`.
 */

import { StudioNotFound } from "@compoz/studio/components/not-found/StudioNotFound";

export default async function DashboardNotFound() {
  return <StudioNotFound />;
}
