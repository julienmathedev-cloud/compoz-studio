"use client";

/**
 * @file apps/studio/src/features/admin/users/components/molecules/UserAdminHeader.tsx
 * @layer ui/molecules
 *
 * @description
 * Header Admin Users :
 * - Select du site en cours d’édition
 * - Select du user à éditer
 *
 * @remarks
 * - Strictement UI-only : aucun fetch, aucune logique métier.
 * - Les options et handlers sont fournis par le parent.
 * - Site : pas de valeur "none" (doit toujours être un tenant valide).
 * - User : valeur vide = aucun user sélectionné (form en mode create).
 */

import { FormGrid } from "@compoz/studio/components/layouts/FormGrid";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { Card, CardContent } from "@compoz/ui/components/ui/card";

import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

import { useTranslations } from "next-intl";

type Option = Readonly<{ value: string; label: string }>;

type UserAdminHeaderProps = Readonly<{
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

const NO_USER_VALUE = "__none__";

export function UserAdminHeader({
  siteId,
  userId,
  siteOptions,
  userOptions,
  onSiteChange,
  onUserChange,
  isLoadingUsers = false,
  disabled = false,
}: UserAdminHeaderProps) {
  const t = useTranslations();

  const formIdPrefix = useIdPrefix("admin-users-header");
  const siteIds = createFieldIds(formIdPrefix, "siteId");
  const userIds = createFieldIds(formIdPrefix, "userId");

  const baseDisabled = disabled || isLoadingUsers;

  const safeSiteOptions = siteOptions
    .map((o) => ({
      value: String(o.value ?? "").trim(),
      label: String(o.label ?? "").trim(),
    }))
    .filter((o) => Boolean(o.value) && Boolean(o.label));

  const safeUserOptions = userOptions
    .map((o) => ({
      value: String(o.value ?? "").trim(),
      label: String(o.label ?? "").trim(),
    }))
    .filter((o) => Boolean(o.value) && Boolean(o.label));

  const effectiveSiteId =
    String(siteId ?? "").trim() || safeSiteOptions[0]?.value || "";

  return (
    <Card variant="panel">
      <CardContent className={cn(STACK_SM)}>
        <FormGrid>
          {/* Site (pas de "none") */}
          <SelectField
            ids={siteIds}
            label={t("admin.users.header.site.label")}
            help={t("admin.users.header.site.help")}
            value={effectiveSiteId}
            onChange={(val) => {
              const next = String(val ?? "").trim();
              console.log("onSiteChange", next);
              if (!next) return; // pas de "none"
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
            label={t("admin.users.header.user.label")}
            help={t("admin.users.header.user.help")}
            value={userId ? userId : NO_USER_VALUE}
            onChange={(val) => {
              const next = String(val ?? "").trim();
              onUserChange(next === NO_USER_VALUE ? null : next);
            }}
            items={[
              {
                value: NO_USER_VALUE,
                label: t("admin.users.header.user.placeholder"),
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

UserAdminHeader.displayName = "UserAdminHeader";
