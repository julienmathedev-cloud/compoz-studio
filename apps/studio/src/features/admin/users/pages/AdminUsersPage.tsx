"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { AdminUsersSection } from "@compoz/studio/features/admin/users/sections/AdminUsersSection";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";

import { useSetActiveTenant } from "@compoz/studio/features/admin/tenant/hooks/useSetActiveTenant";

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
      const next = String(tenantId ?? "")
        .trim()
        .toLowerCase();
      if (!next) return;

      console.log("handleTenantChange", next);

      await setActiveTenant(next);
      router.refresh();
    },
    [setActiveTenant, router],
  );

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.users")}
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
