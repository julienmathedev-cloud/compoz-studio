"use client";

/**
 * @file apps/studio/src/features/admin/users/pages/AdminUsersPage.tsx
 * @layer studio/features/admin/users/pages
 *
 * @description
 * Studio admin users page orchestrating active Website switching and section rendering.
 *
 * @remarks
 * - Does not fetch directly; data is provided by the server route page.
 * - Active Website changes go through `useSetActiveWebsite()` and then `router.refresh()`.
 * - Website values handled here are Prisma Website.id values.
 */

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { AdminUsersSection } from "@compoz/studio/features/admin/users/sections/AdminUsersSection";
import { useSetActiveWebsite } from "@compoz/studio/features/admin/website/useSetActiveWebsite";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

type AdminUsersPageProps = Readonly<{
  currentWebsiteId: string;
  websiteOptions: ReadonlyArray<SelectOption>;
  currentUser: CurrentUser;
}>;

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export function AdminUsersPage({
  currentWebsiteId,
  websiteOptions,
  currentUser,
}: AdminUsersPageProps) {
  const t = useTranslations();
  const router = useRouter();

  const { setActiveWebsite, isSaving } = useSetActiveWebsite();

  const handleWebsiteChange = useCallback(
    async (websiteId: string) => {
      const nextWebsiteId = requireWebsiteId(websiteId, "websiteId");

      await setActiveWebsite(nextWebsiteId);

      router.refresh();
    },
    [setActiveWebsite, router],
  );

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.users")}
      </Heading>

      <AdminUsersSection
        currentWebsiteId={currentWebsiteId}
        websiteOptions={websiteOptions}
        onWebsiteChange={handleWebsiteChange}
        isFormSaving={isSaving}
        currentUser={currentUser}
      />
    </div>
  );
}

AdminUsersPage.displayName = "AdminUsersPage";
