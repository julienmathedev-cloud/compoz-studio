"use client";

/**
 * @file apps/studio/src/features/admin/users/sections/AdminUsersSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section Users (Studio) :
 * - header (tenant + user select)
 * - form create/edit
 *
 * @remarks
 * - Container/orchestrateur : state UI + wiring hooks + submit/delete.
 * - UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { AdminUsersForm } from "@compoz/studio/features/admin/users/components/forms/AdminUsersForm";
import { AdminUsersHeader } from "@compoz/studio/features/admin/users/components/molecules/AdminUsersHeader";

import { useCreateUser } from "@compoz/studio/features/admin/users/hooks/useCreateUser";
import { useDeleteUser } from "@compoz/studio/features/admin/users/hooks/useDeleteUser";
import { useListUsers } from "@compoz/studio/features/admin/users/hooks/useListUsers";
import { useReadUser } from "@compoz/studio/features/admin/users/hooks/useReadUser";
import { useUpdateUser } from "@compoz/studio/features/admin/users/hooks/useUpdateUser";

import {
  normalizeUserFormValues,
  toUserFormValuesFromDTO,
} from "@compoz/studio/features/admin/users/mappers/users-form";

import { toTenantId } from "@compoz/ui/lib/tenant-id";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_LG } from "@compoz/ui/styles/studio/layout";

import type { UserFormValues } from "@compoz/validation/users/user-form";

type SelectOption = Readonly<{ value: string; label: string }>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

type AdminUsersSectionProps = Readonly<{
  currentTenantId: string;
  tenantOptions: ReadonlyArray<SelectOption>;
  onTenantChange: (tenantId: string) => void | Promise<void>;
  isFormSaving?: boolean;

  /** Utilisé pour bloquer la suppression de soi-même. */
  currentUser: CurrentUser;
}>;

function toUserSelectOptions(
  users: ReadonlyArray<{ id?: unknown; name?: unknown; email?: unknown }>,
): ReadonlyArray<SelectOption> {
  return users
    .map((u) => {
      const id = String(u.id ?? "").trim();
      if (!id) return null;

      const name = String(u.name ?? "").trim();
      const email = String(u.email ?? "").trim();
      const label = name ? `${name} — ${email}` : email;

      return { value: id, label } as const;
    })
    .filter((x): x is SelectOption => Boolean(x));
}

function canDeleteUser(args: {
  mode: "create" | "edit";
  selectedUserId: string | null;
  currentUser: CurrentUser;
  targetEmail?: string | null | undefined;
}): boolean {
  const { mode, selectedUserId, currentUser, targetEmail } = args;

  if (mode !== "edit") return false;

  const targetId = String(selectedUserId ?? "").trim();
  if (!targetId) return false;

  const meId = String(currentUser.id ?? "").trim();
  if (meId && targetId === meId) return false;

  // fallback : comparaison email (si jamais l’id session est absent / différent)
  const target = String(targetEmail ?? "")
    .trim()
    .toLowerCase();
  const me = String(currentUser.email ?? "")
    .trim()
    .toLowerCase();
  if (target && me && target === me) return false;

  return true;
}

export function AdminUsersSection({
  currentTenantId,
  tenantOptions,
  onTenantChange,
  isFormSaving,
  currentUser,
}: AdminUsersSectionProps) {
  const t = useTranslations();

  // ---------------------------------------------------------------------------
  // Users list (Studio)
  // ---------------------------------------------------------------------------
  const { users, isLoading: isLoadingUsers } = useListUsers();

  const userOptions: ReadonlyArray<SelectOption> = useMemo(() => {
    return toUserSelectOptions(users);
  }, [users]);

  // ---------------------------------------------------------------------------
  // State UI
  // ---------------------------------------------------------------------------
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() =>
    String(currentTenantId ?? "").trim(),
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const mode: "create" | "edit" = selectedUserId ? "edit" : "create";

  // ---------------------------------------------------------------------------
  // Form reset helpers
  // ---------------------------------------------------------------------------
  const [formKey, setFormKey] = useState(0);
  const [isDirtyLocal, setIsDirtyLocal] = useState(false);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  const resetFormUi = useCallback(() => {
    setBlockingErrorsCount(0);
    setIsDirtyLocal(false);
    setFormKey((k) => k + 1);
  }, []);

  // ---------------------------------------------------------------------------
  // Header handlers
  // ---------------------------------------------------------------------------
  const handleSiteChange = useCallback(
    async (siteId: string) => {
      const next = toTenantId(siteId);
      if (!next) return;

      setSelectedSiteId(next);
      await onTenantChange(next);
    },
    [onTenantChange],
  );

  const handleUserChange = useCallback(
    (userId: string | null) => {
      const next = String(userId ?? "").trim();
      const nextId = next ? next : null;

      resetFormUi();
      setSelectedUserId(nextId);
    },
    [resetFormUi],
  );

  // ---------------------------------------------------------------------------
  // Read selected user (edit mode)
  // ---------------------------------------------------------------------------
  const { user, isLoading: isLoadingUser } = useReadUser(selectedUserId ?? "");

  // ---------------------------------------------------------------------------
  // Baseline (pour update)
  // ---------------------------------------------------------------------------
  const baselineRef = useRef<UserFormValues | null>(null);

  const initialValues = useMemo<UserFormValues>(() => {
    if (mode === "create") return toUserFormValuesFromDTO(null);
    return toUserFormValuesFromDTO(user);
  }, [mode, user]);

  useEffect(() => {
    baselineRef.current = initialValues;
  }, [initialValues]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const { create, isCreating } = useCreateUser();

  const { update, isUpdating } = useUpdateUser(async () => {
    resetFormUi();
    setSelectedUserId(null);
  });

  const { remove: deleteUser, isDeleting, deletingUserId } = useDeleteUser();

  const isSaving = isCreating || isUpdating || Boolean(isFormSaving);
  const isBusy = Boolean(isSaving || isDeleting);

  // ---------------------------------------------------------------------------
  // Delete (edit only) + guard self-delete
  // ---------------------------------------------------------------------------
  const canDelete = useMemo(() => {
    return canDeleteUser({
      mode,
      selectedUserId,
      currentUser,
      targetEmail: user?.email,
    });
  }, [mode, selectedUserId, currentUser, user?.email]);

  const handleDelete = useCallback(async () => {
    if (!canDelete) return;

    const id = String(selectedUserId ?? "").trim();
    if (!id) return;

    const label = String(user?.email ?? "").trim() || undefined;

    await deleteUser({ userId: id, label });

    resetFormUi();
    setSelectedUserId(null);
  }, [canDelete, deleteUser, resetFormUi, selectedUserId, user?.email]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (values: UserFormValues) => {
      const normalized = normalizeUserFormValues(values);

      if (mode === "create") {
        await create(normalized);
        resetFormUi();
        return;
      }

      const originalId = String(user?.id ?? selectedUserId ?? "").trim();
      if (!originalId) return;

      const baseline = baselineRef.current ?? initialValues;

      await update(originalId, baseline, normalized);
    },
    [
      create,
      update,
      mode,
      user?.id,
      selectedUserId,
      initialValues,
      resetFormUi,
    ],
  );

  // ---------------------------------------------------------------------------
  // Titles / loading
  // ---------------------------------------------------------------------------
  const title =
    mode === "edit"
      ? t("studio.users.section.titleEdit", {
          email: user?.email ?? selectedUserId ?? "",
        })
      : t("studio.users.section.titleCreate");

  const description =
    mode === "edit"
      ? t("studio.users.section.descriptionEdit")
      : t("studio.users.section.descriptionCreate");

  const sectionLoading = Boolean(
    isLoadingUsers || (mode === "edit" && isLoadingUser),
  );

  return (
    <div className={cn(STACK_LG)}>
      <SettingsSection
        id="admin-users"
        title={t("studio.users.section.title")}
        description={t("studio.users.section.description")}
        isLoading={Boolean(isLoadingUsers)}
      >
        <AdminUsersHeader
          siteId={selectedSiteId}
          userId={selectedUserId}
          siteOptions={tenantOptions}
          userOptions={userOptions}
          onSiteChange={handleSiteChange}
          onUserChange={handleUserChange}
          isLoadingUsers={isLoadingUsers}
        />
      </SettingsSection>

      <SettingsSection
        id="user-edit"
        title={title}
        description={description}
        isBusy={isBusy}
        isLoading={sectionLoading}
        isDirty={isDirtyLocal}
        blockingErrorsCount={blockingErrorsCount}
      >
        <AdminUsersForm
          key={formKey}
          initialValues={initialValues}
          isSaving={isSaving}
          mode={mode}
          onSubmit={handleSubmit}
          onReset={() => {
            resetFormUi();
            if (mode === "edit") setSelectedUserId(null);
          }}
          onDirtyChange={(dirty) => setIsDirtyLocal(Boolean(dirty))}
          onBlockingErrorsCountChange={setBlockingErrorsCount}
          // --- delete wiring (edit only)
          canDelete={canDelete}
          isDeleting={Boolean(isDeleting && deletingUserId === selectedUserId)}
          onDelete={handleDelete}
        />
      </SettingsSection>
    </div>
  );
}

AdminUsersSection.displayName = "AdminUsersSection";
