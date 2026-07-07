"use client";

/**
 * @file apps/studio/src/features/admin/users/components/molecules/AdminUsersHeader.tsx
 * @layer studio/features/admin/users/components/molecules
 *
 * @description
 * Header controls for the Studio admin users page.
 *
 * @remarks
 * - Options and handlers are provided by the parent.
 * - The active Website must always resolve to a valid Prisma Website.id.
 * - Empty user selection means no user is selected, so the form stays in create mode.
 */

import { useTranslations } from "next-intl";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

type Option = Readonly<{
  value: string;
  label: string;
}>;

export type AdminUsersHeaderProps = Readonly<{
  websiteId: string;

  /** Selected user; `null` keeps the form in create mode. */
  userId: string | null;

  websiteOptions: ReadonlyArray<Option>;
  userOptions: ReadonlyArray<Option>;

  onWebsiteChange: (websiteId: string) => void;
  onUserChange: (userId: string | null) => void;

  isLoadingUsers?: boolean;
  disabled?: boolean;
}>;

const NO_USER_VALUE = "__none__" as const;

function normalizeText(input: unknown): string {
  return String(input ?? "").trim();
}

function normalizeWebsiteId(input: unknown): string {
  return normalizeText(input);
}

export function AdminUsersHeader({
  websiteId,
  userId,
  websiteOptions,
  userOptions,
  onWebsiteChange,
  onUserChange,
  isLoadingUsers = false,
  disabled = false,
}: AdminUsersHeaderProps) {
  const t = useTranslations();

  const formIdPrefix = useIdPrefix("admin-users-header");
  const websiteIds = createFieldIds(formIdPrefix, "websiteId");
  const userIds = createFieldIds(formIdPrefix, "userId");

  const baseDisabled = Boolean(disabled || isLoadingUsers);

  const safeWebsiteOptions = websiteOptions
    .map((option) => {
      const value = normalizeWebsiteId(option.value);
      const label = normalizeText(option.label);

      return { value, label };
    })
    .filter((option) => Boolean(option.value) && Boolean(option.label));

  const safeUserOptions = userOptions
    .map((option) => {
      const value = normalizeText(option.value);
      const label = normalizeText(option.label);

      return { value, label };
    })
    .filter((option) => Boolean(option.value) && Boolean(option.label));

  const effectiveWebsiteId =
    normalizeWebsiteId(websiteId) || safeWebsiteOptions[0]?.value || "";

  return (
    <Card variant="panel" visualMode="studio">
      <CardContent className={cn(STACK_SM)}>
        <FormGrid>
          <SelectField
            ids={websiteIds}
            label={t("studio.users.header.website.label")}
            help={t("studio.users.header.website.help")}
            value={effectiveWebsiteId}
            onChange={(value) => {
              const nextWebsiteId = normalizeWebsiteId(value);

              if (!nextWebsiteId) return;

              onWebsiteChange(nextWebsiteId);
            }}
            items={safeWebsiteOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            disabled={baseDisabled || safeWebsiteOptions.length === 0}
          />

          <SelectField
            ids={userIds}
            label={t("studio.users.header.user.label")}
            help={t("studio.users.header.user.help")}
            value={userId ? normalizeText(userId) : NO_USER_VALUE}
            onChange={(value) => {
              const nextUserId = normalizeText(value);

              onUserChange(nextUserId === NO_USER_VALUE ? null : nextUserId);
            }}
            items={[
              {
                value: NO_USER_VALUE,
                label: t("studio.users.header.user.placeholder"),
              },
              ...safeUserOptions.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            disabled={baseDisabled}
          />
        </FormGrid>
      </CardContent>
    </Card>
  );
}

AdminUsersHeader.displayName = "AdminUsersHeader";
