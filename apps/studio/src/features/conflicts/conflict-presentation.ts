/**
 * @file apps/studio/src/features/conflicts/conflict-presentation.ts
 * @layer studio/features/conflicts
 * @description Pure, user-facing view model helpers for OCC conflict resolution.
 */

export type ConflictPresentationStatus =
  | "server-only"
  | "local-only"
  | "same-change"
  | "conflict";

export type ConflictResolutionChoice = "server" | "local";

export type ConflictValueEquality<T> = (left: T, right: T) => boolean;

export type ConflictDisplayValue =
  | Readonly<{ kind: "empty"; text: string }>
  | Readonly<{ kind: "text"; text: string }>
  | Readonly<{ kind: "boolean"; text: string }>
  | Readonly<{ kind: "list"; items: readonly string[] }>
  | Readonly<{ kind: "rich-text"; text: string }>;

export type ConflictPresentationDetail = Readonly<{
  id: string;
  label: string;
  value: ConflictDisplayValue;
}>;

export type ConflictPresentationComparison = Readonly<{
  baseline: ConflictDisplayValue;
  server: ConflictDisplayValue;
  local: ConflictDisplayValue;
}>;

export type ConflictActionExecutionResult =
  | Readonly<{ status: "success" }>
  | Readonly<{ status: "error" }>;

export const CONFLICT_ACTION_SUCCESS: ConflictActionExecutionResult = {
  status: "success",
};

export const CONFLICT_ACTION_ERROR: ConflictActionExecutionResult = {
  status: "error",
};

export type ConflictPresentationItem = Readonly<{
  id: string;
  label: string;
  context?: string;
  status: ConflictPresentationStatus;
  comparison?: ConflictPresentationComparison;
  resolutionMode: "automatic" | "choice" | "manual";
  choice?: ConflictResolutionChoice;
  details?: readonly ConflictPresentationDetail[];
}>;

export type ConflictPresentationGroup = Readonly<{
  id: string;
  label?: string;
  items: readonly ConflictPresentationItem[];
}>;

export function classifyConflictValue<T>(
  baseline: T,
  server: T,
  local: T,
  equals: ConflictValueEquality<T> = Object.is,
): ConflictPresentationStatus | null {
  const serverChanged = !equals(server, baseline);
  const localChanged = !equals(local, baseline);

  if (!serverChanged && !localChanged) return null;
  if (serverChanged && !localChanged) return "server-only";
  if (!serverChanged && localChanged) return "local-only";
  if (equals(server, local)) return "same-change";
  return "conflict";
}

export function resolutionModeForStatus(
  status: ConflictPresentationStatus,
): ConflictPresentationItem["resolutionMode"] {
  return status === "conflict" ? "choice" : "automatic";
}

export function conflictPresentationStatusKey(input: Readonly<{
  status: ConflictPresentationStatus;
  resolutionMode: ConflictPresentationItem["resolutionMode"];
}>): "serverOnly" | "localOnly" | "sameChange" | "conflict" | "manual" {
  if (input.resolutionMode === "manual") return "manual";
  switch (input.status) {
    case "server-only": return "serverOnly";
    case "local-only": return "localOnly";
    case "same-change": return "sameChange";
    case "conflict": return "conflict";
  }
}

export function hasCompleteConflictChoices(
  groups: readonly ConflictPresentationGroup[],
): boolean {
  return groups.every((group) =>
    group.items.every(
      (item) => item.resolutionMode !== "choice" || item.choice !== undefined,
    ),
  );
}

export function canApplyConflictResolution(
  groups: readonly ConflictPresentationGroup[],
  pending = false,
): boolean {
  return !pending && hasCompleteConflictChoices(groups) && groups.every((group) =>
    group.items.every((item) => item.resolutionMode !== "manual"),
  );
}

export function toPlainTextRichText(value: string, emptyText: string): string {
  const decodeNumericEntity = (
    match: string,
    hex: string | undefined,
    decimal: string | undefined,
  ): string => {
    const codePoint = Number.parseInt(hex ?? decimal ?? "", hex ? 16 : 10);
    if (
      !Number.isInteger(codePoint) ||
      codePoint < 0 ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return "�";
    }
    return String.fromCodePoint(codePoint);
  };

  const text = value
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>/giu, "\n")
    .replace(/<br\s*\/?\s*>/giu, "\n")
    .replace(/<[^>]*>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/giu, decodeNumericEntity)
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  return text || emptyText;
}

export function displayText(value: string | null | undefined, emptyText: string): ConflictDisplayValue {
  return value ? { kind: "text", text: value } : { kind: "empty", text: emptyText };
}
