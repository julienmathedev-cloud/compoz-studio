"use client";

/**
 * @file apps/studio/src/features/admin/users/pages/AdminUsersPage.tsx
 * @layer app/admin/users
 *
 * @description
 * Page Users (Studio) : orchestration “tenant switch” + rendu de la section.
 *
 * @remarks
 * - UI-only : pas de fetch ici.
 * - Le changement de tenant passe par `useSetActiveTenant()` puis `router.refresh()`.
 */

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { useSetActiveTenant } from "@compoz/studio/features/admin/tenant/useSetActiveTenant";
import { AdminUsersSection } from "@compoz/studio/features/admin/users/sections/AdminUsersSection";

import { requireTenantId } from "@compoz/ui/lib/tenant-id";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

type SelectOption = Readonly<{ value: string; label: string }>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

type AdminUsersPageProps = Readonly<{
  currentTenantId: string;
  tenantOptions: ReadonlyArray<SelectOption>;
  currentUser: CurrentUser;
}>;

export function AdminUsersPage({
  currentTenantId,
  tenantOptions,
  currentUser,
}: AdminUsersPageProps) {
  const t = useTranslations();
  const router = useRouter();

  const { setActiveTenant, isSaving } = useSetActiveTenant();

  const handleTenantChange = useCallback(
    async (tenantId: string) => {
      const next = requireTenantId(tenantId, "tenantId");
      await setActiveTenant(next);
      router.refresh();
    },
    [setActiveTenant, router],
  );

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.users")}
      </Heading>

      <AdminUsersSection
        currentTenantId={currentTenantId}
        tenantOptions={tenantOptions}
        onTenantChange={handleTenantChange}
        isFormSaving={isSaving}
        currentUser={currentUser}
      />
    </div>
  );
}

AdminUsersPage.displayName = "AdminUsersPage";
