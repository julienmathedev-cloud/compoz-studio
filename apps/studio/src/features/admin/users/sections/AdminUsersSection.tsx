"use client";

/**
 * @file apps/studio/src/features/admin/users/sections/AdminUsersSection.tsx
 * @layer studio/features/admin/users/sections
 *
 * @description
 * Studio admin users section for Website selection and user create/edit flows.
 *
 * @remarks
 * - Orchestrates local UI state, user hooks, submit, delete, and form reset behavior.
 * - Renders the active Website and selected user header before the create/edit form.
 * - Website values handled here are Prisma Website.id values.
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

import { cn } from "@compoz/ui/lib/utils";
import { STACK_LG } from "@compoz/ui/styles/studio/layout";

import type { UserFormValues } from "@compoz/validation/users/user-form";

type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

type CurrentUser = Readonly<{
  id: string;
  email: string;
}>;

type AdminUsersSectionProps = Readonly<{
  currentWebsiteId: string;
  websiteOptions: ReadonlyArray<SelectOption>;
  onWebsiteChange: (websiteId: string) => void | Promise<void>;
  isFormSaving?: boolean;

  /** Used to prevent deleting the current signed-in user. */
  currentUser: CurrentUser;
}>;

function normalizeWebsiteId(input: unknown): string {
  return String(input ?? "").trim();
}

function toUserSelectOptions(
  users: ReadonlyArray<{ id?: unknown; name?: unknown; email?: unknown }>,
): ReadonlyArray<SelectOption> {
  return users
    .map((user) => {
      const id = String(user.id ?? "").trim();

      if (!id) return null;

      const name = String(user.name ?? "").trim();
      const email = String(user.email ?? "").trim();
      const label = name ? `${name} — ${email}` : email;

      return { value: id, label } as const;
    })
    .filter((option): option is SelectOption => Boolean(option));
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

  const currentUserId = String(currentUser.id ?? "").trim();

  if (currentUserId && targetId === currentUserId) return false;

  /**
   * Fallback to email comparison when the session user id is missing or differs.
   */
  const target = String(targetEmail ?? "")
    .trim()
    .toLowerCase();

  const current = String(currentUser.email ?? "")
    .trim()
    .toLowerCase();

  if (target && current && target === current) return false;

  return true;
}

export function AdminUsersSection({
  currentWebsiteId,
  websiteOptions,
  onWebsiteChange,
  isFormSaving,
  currentUser,
}: AdminUsersSectionProps) {
  const t = useTranslations();

  // Users list

  const { users, isLoading: isLoadingUsers } = useListUsers();

  const userOptions: ReadonlyArray<SelectOption> = useMemo(() => {
    return toUserSelectOptions(users);
  }, [users]);

  // UI state

  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>(() =>
    normalizeWebsiteId(currentWebsiteId),
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const mode: "create" | "edit" = selectedUserId ? "edit" : "create";

  /** Resynchronizes the local select state when the active Website changes after refresh. */
  useEffect(() => {
    setSelectedWebsiteId(normalizeWebsiteId(currentWebsiteId));
  }, [currentWebsiteId]);

  // Form reset helpers

  const [formKey, setFormKey] = useState(0);
  const [isDirtyLocal, setIsDirtyLocal] = useState(false);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  const resetFormUi = useCallback(() => {
    setBlockingErrorsCount(0);
    setIsDirtyLocal(false);
    setFormKey((key) => key + 1);
  }, []);

  // Header handlers

  const handleWebsiteChange = useCallback(
    async (websiteId: string) => {
      const nextWebsiteId = normalizeWebsiteId(websiteId);

      if (!nextWebsiteId) return;

      setSelectedWebsiteId(nextWebsiteId);
      await onWebsiteChange(nextWebsiteId);
    },
    [onWebsiteChange],
  );

  const handleUserChange = useCallback(
    (userId: string | null) => {
      const next = String(userId ?? "").trim();
      const nextUserId = next ? next : null;

      resetFormUi();
      setSelectedUserId(nextUserId);
    },
    [resetFormUi],
  );

  // Read selected user

  const { user, isLoading: isLoadingUser } = useReadUser(selectedUserId ?? "");

  // Baseline used to build update patches.

  const baselineRef = useRef<UserFormValues | null>(null);

  const initialValues = useMemo<UserFormValues>(() => {
    if (mode === "create") return toUserFormValuesFromDTO(null);

    return toUserFormValuesFromDTO(user);
  }, [mode, user]);

  useEffect(() => {
    baselineRef.current = initialValues;
  }, [initialValues]);

  // Mutations

  const { create, isCreating } = useCreateUser();

  const { update, isUpdating } = useUpdateUser(async () => {
    resetFormUi();
    setSelectedUserId(null);
  });

  const { remove: deleteUser, isDeleting, deletingUserId } = useDeleteUser();

  const isSaving = isCreating || isUpdating || Boolean(isFormSaving);
  const isBusy = Boolean(isSaving || isDeleting);

  // Delete guard prevents deleting the current signed-in user.

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

  // Submit

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

  // Titles / loading

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
          websiteId={selectedWebsiteId}
          userId={selectedUserId}
          websiteOptions={websiteOptions}
          userOptions={userOptions}
          onWebsiteChange={handleWebsiteChange}
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

            if (mode === "edit") {
              setSelectedUserId(null);
            }
          }}
          onDirtyChange={(dirty) => setIsDirtyLocal(Boolean(dirty))}
          onBlockingErrorsCountChange={setBlockingErrorsCount}
          websiteOptions={websiteOptions}
          canDelete={canDelete}
          isDeleting={Boolean(isDeleting && deletingUserId === selectedUserId)}
          onDelete={handleDelete}
        />
      </SettingsSection>
    </div>
  );
}

AdminUsersSection.displayName = "AdminUsersSection";
