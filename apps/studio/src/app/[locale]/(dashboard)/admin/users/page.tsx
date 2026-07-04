/**
 * @file apps/studio/src/app/[locale]/(dashboard)/admin/users/page.tsx
 * @layer studio/app
 *
 * @description
 * Page route "Admin / Users" côté server.
 *
 * @remarks
 * - Guard : nécessite une session admin.
 * - Construit les options de Websites accessibles à partir des IDs de session.
 * - Utilise le Prisma Website.id comme valeur technique.
 * - Utilise le Website.name comme libellé affiché.
 * - Rend la page UI dédiée côté client.
 */

import "server-only";

import { prisma } from "@compoz/infra/prisma/prisma-client";
import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { AdminUsersPage } from "@compoz/studio/features/admin/users/pages/AdminUsersPage";

type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeWebsiteId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeWebsiteName(value: unknown): string {
  return String(value ?? "").trim();
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function StudioAdminUsersRoutePage() {
  const session = await requireAdminSession();

  const currentWebsiteId = normalizeWebsiteId(session.websiteId);

  if (!currentWebsiteId) {
    // Session admin sans Website.id actif = état invalide.
    return null;
  }

  const accessibleWebsiteIds = session.websiteIds
    .map(normalizeWebsiteId)
    .filter(Boolean);

  const websites = await prisma.website.findMany({
    where: {
      id: {
        in: accessibleWebsiteIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const websiteOptions: ReadonlyArray<SelectOption> = websites
    .map((website) => {
      const websiteId = normalizeWebsiteId(website.id);
      const websiteName = normalizeWebsiteName(website.name);

      if (!websiteId || !websiteName) {
        return null;
      }

      return {
        value: websiteId,
        label: websiteName,
      } as const;
    })
    .filter((option): option is SelectOption => Boolean(option));

  const currentUser: CurrentUser = {
    id: String(session.user?.id ?? "").trim(),
    email: String(session.user?.email ?? "")
      .trim()
      .toLowerCase(),
  };

  return (
    <AdminUsersPage
      currentWebsiteId={currentWebsiteId}
      websiteOptions={websiteOptions}
      currentUser={currentUser}
    />
  );
}

StudioAdminUsersRoutePage.displayName = "StudioAdminUsersRoutePage";
