"use client";

/**
 * @file apps/studio/src/features/admin/users/components/molecules/AdminUsersHeader.tsx
 * @layer studio/features/admin/users/components/molecules
 *
 * @description
 * Header “Users” (admin Studio) :
 * - Select du site/tenant actif
 * - Select du user à éditer
 *
 * @remarks
 * - Strictement UI-only : aucun fetch, aucune logique métier.
 * - Les options et handlers sont fournis par le parent.
 * - Site : pas de valeur "none" (doit toujours être un tenant valide).
 * - User : valeur vide = aucun user sélectionné (form en mode create).
 */

import { useTranslations } from "next-intl";

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { Card, CardContent } from "@compoz/ui/components/ui/card";

import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { toTenantId } from "@compoz/ui/lib/tenant-id";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

type Option = Readonly<{ value: string; label: string }>;

export type AdminUsersHeaderProps = Readonly<{
  /** Tenant/site actif (doit être une valeur valide). */
  siteId: string;

  /** User sélectionné (null = aucun => form en create). */
  userId: string | null;

  siteOptions: ReadonlyArray<Option>;
  userOptions: ReadonlyArray<Option>;

  onSiteChange: (siteId: string) => void;
  onUserChange: (userId: string | null) => void;

  isLoadingUsers?: boolean;
  disabled?: boolean;
}>;

const NO_USER_VALUE = "__none__" as const;

function normalizeText(input: unknown): string {
  return String(input ?? "").trim();
}

export function AdminUsersHeader({
  siteId,
  userId,
  siteOptions,
  userOptions,
  onSiteChange,
  onUserChange,
  isLoadingUsers = false,
  disabled = false,
}: AdminUsersHeaderProps) {
  const t = useTranslations();

  const formIdPrefix = useIdPrefix("admin-users-header");
  const siteIds = createFieldIds(formIdPrefix, "siteId");
  const userIds = createFieldIds(formIdPrefix, "userId");

  const baseDisabled = Boolean(disabled || isLoadingUsers);

  const safeSiteOptions = siteOptions
    .map((o) => {
      const value = toTenantId(o.value) ?? "";
      const label = normalizeText(o.label);
      return { value, label };
    })
    .filter((o) => Boolean(o.value) && Boolean(o.label));

  const safeUserOptions = userOptions
    .map((o) => {
      const value = normalizeText(o.value);
      const label = normalizeText(o.label);
      return { value, label };
    })
    .filter((o) => Boolean(o.value) && Boolean(o.label));

  const effectiveSiteId = toTenantId(siteId) ?? safeSiteOptions[0]?.value ?? "";

  return (
    <Card variant="panel" visualMode="studio">
      <CardContent className={cn(STACK_SM)}>
        <FormGrid>
          {/* Site (pas de "none") */}
          <SelectField
            ids={siteIds}
            label={t("studio.users.header.site.label")}
            help={t("studio.users.header.site.help")}
            value={effectiveSiteId}
            onChange={(val) => {
              const next = toTenantId(val);
              if (!next) return;
              onSiteChange(next);
            }}
            items={safeSiteOptions.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            disabled={baseDisabled || safeSiteOptions.length === 0}
          />

          {/* User (vide = create) */}
          <SelectField
            ids={userIds}
            label={t("studio.users.header.user.label")}
            help={t("studio.users.header.user.help")}
            value={userId ? normalizeText(userId) : NO_USER_VALUE}
            onChange={(val) => {
              const next = normalizeText(val);
              onUserChange(next === NO_USER_VALUE ? null : next);
            }}
            items={[
              {
                value: NO_USER_VALUE,
                label: t("studio.users.header.user.placeholder"),
              },
              ...safeUserOptions.map((o) => ({
                value: o.value,
                label: o.label,
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
