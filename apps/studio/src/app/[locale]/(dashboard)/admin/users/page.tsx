/**
 * @file apps/studio/src/app/[locale]/(dashboard)/admin/users/page.tsx
 * @layer app/studio
 *
 * @description
 * Page route "Admin / Users" (Server) :
 * - Guard: nécessite session + role=admin
 * - Construit les options de tenants (sans "*")
 * - Rend la page UI dédiée (Client)
 */

import "server-only";

import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { AdminUsersPage } from "@compoz/studio/features/admin/users/pages/AdminUsersPage";

type SelectOption = Readonly<{ value: string; label: string }>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

export default async function AdminUsersRoutePage() {
  const session = await requireAdminSession();

  const currentTenantId = String(session.tenantId ?? "")
    .trim()
    .toLowerCase();

  const tenantIds = Array.isArray(session.tenantIds) ? session.tenantIds : [];
  const tenantOptions: ReadonlyArray<SelectOption> = tenantIds
    .map((t) =>
      String(t ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
    .filter((x) => x !== "*")
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

AdminUsersRoutePage.displayName = "AdminUsersRoutePage";
