/**
 * @file apps/studio/src/features/settings/hooks/settings-save-notification.ts
 * @layer studio/features/settings/hooks
 * @description Pure notification selection for Settings save results.
 */

export const AUTOMATIC_MERGE_NOTIFICATION = "automaticMerge" as const;

type SettingsSaveNotificationInput =
  | Readonly<{ status: "conflict" }>
  | Readonly<{
      status: "noChanges" | "saved";
      fields: readonly string[];
      notification?: typeof AUTOMATIC_MERGE_NOTIFICATION;
    }>;

export type SettingsSaveNotification =
  | Readonly<{ kind: "automaticMerge" }>
  | Readonly<{ kind: "noChanges" }>
  | Readonly<{ kind: "updated"; fields: readonly string[] }>
  | null;

/** Gives the explicit automatic-merge marker precedence over outcome toasts. */
export function settingsSaveNotificationFor(
  result: SettingsSaveNotificationInput,
): SettingsSaveNotification {
  if (result.status === "conflict") return null;
  if (result.notification === AUTOMATIC_MERGE_NOTIFICATION) {
    return { kind: "automaticMerge" };
  }
  if (result.status === "noChanges") return { kind: "noChanges" };
  return { kind: "updated", fields: result.fields };
}
