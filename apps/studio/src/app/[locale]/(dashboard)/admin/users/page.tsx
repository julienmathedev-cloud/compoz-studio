/**
 * @file apps/studio/src/app/[locale]/(dashboard)/admin/users/page.tsx
 * @layer studio/app
 *
 * @description
 * Page route "Admin / Users" (Server) :
 * - Guard: nécessite session + role=admin
 * - Construit les options de tenants (sans "*")
 * - Rend la page UI dédiée (Client)
 */

import "server-only";

import { toTenantId } from "@compoz/ui/lib/tenant-id";

import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { AdminUsersPage } from "@compoz/studio/features/admin/users/pages/AdminUsersPage";

type SelectOption = Readonly<{ value: string; label: string }>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

export default async function StudioAdminUsersRoutePage() {
  const session = await requireAdminSession();

  const currentTenantId = toTenantId(session.tenantId);
  if (!currentTenantId) {
    // Session admin sans tenantId = état invalide → 404 (évite un comportement flou)
    return null;
  }

  const tenantIds = Array.isArray(session.tenantIds) ? session.tenantIds : [];

  const tenantOptions: ReadonlyArray<SelectOption> = tenantIds
    .map((t) => toTenantId(t))
    .filter((t): t is string => Boolean(t))
    .filter((t) => t !== "*")
    .map((tenantId) => ({ value: tenantId, label: tenantId }) as const);

  const currentUser: CurrentUser = {
    id: String(session?.user?.id ?? "").trim(),
    email: String(session?.user?.email ?? "")
      .trim()
      .toLowerCase(),
  };

  return (
    <AdminUsersPage
      currentTenantId={currentTenantId}
      tenantOptions={tenantOptions}
      currentUser={currentUser}
    />
  );
}

StudioAdminUsersRoutePage.displayName = "StudioAdminUsersRoutePage";
