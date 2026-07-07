/**
 * @file apps/studio/src/app/[locale]/(dashboard)/page.tsx
 * @layer studio/app
 *
 * @description
 * Main Studio Dashboard page.
 *
 * @remarks
 * - `OverviewPage` owns `?tab=` handling for tab/URL synchronization.
 */

import { getServerSession } from "next-auth";

import { authOptions } from "@compoz/studio/auth/auth";
import { isAdminRole } from "@compoz/studio/auth/require-session";
import { OverviewPage } from "@compoz/studio/features/overview/pages/OverviewPage";

export default async function StudioOverviewPage() {
  const session = await getServerSession(authOptions);
  const isDemo = session?.user?.isDemo === true;
  const isAdmin = isAdminRole(session?.user?.role);

  return <OverviewPage isDemo={isDemo} isAdmin={isAdmin} />;
}
