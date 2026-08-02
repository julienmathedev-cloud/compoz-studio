/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict.ts
 * @layer studio/features/pages/conflicts
 * @description Pure state and value resolution for page metadata OCC conflicts.
 */

import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import type { PageMetadataField } from "@compoz/core/domain/pages/revisions/page-metadata";
import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import {
  classifyConflictValue,
  type ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import { toPageFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

export const PAGE_METADATA_CONFLICT_FIELDS = [
  "name",
  "slug",
  "seoTitle",
  "seoDescription",
  "sitemap",
  "paginationEnabled",
] as const satisfies readonly PageMetadataField[];

export type PageMetadataConflictChoices = Readonly<
  Partial<Record<PageMetadataField, ConflictResolutionChoice>>
>;

export type PageMetadataConflictState = Readonly<{
  details: PageMetadataConflictDetails;
  baseline: PageFormValues;
  local: PageFormValues;
}>;

export type PageMetadataConflictResolution =
  | Readonly<{ status: "resolved"; values: PageFormValues }>
  | Readonly<{ status: "incomplete"; missingFields: readonly PageMetadataField[] }>;

export function pageMetadataConflictId(
  state: PageMetadataConflictState,
): string {
  return `page-metadata-${state.details.current.page.id}-${state.details.currentMetaRevision}`;
}

export function createPageMetadataConflictState(
  details: PageMetadataConflictDetails,
  baseline: PageFormValues,
  local: PageFormValues,
): PageMetadataConflictState {
  return {
    details,
    baseline: structuredClone(baseline),
    local: structuredClone(local),
  };
}

export function currentPageMetadataValues(
  state: PageMetadataConflictState,
  localParentId: PageFormValues["parentId"],
): PageFormValues {
  return {
    ...toPageFormValuesFromDTO(state.details.current.page),
    parentId: localParentId,
  };
}

export function keepLocalPageMetadataValues(
  state: PageMetadataConflictState,
  localParentId: PageFormValues["parentId"],
): PageFormValues {
  return {
    ...state.local,
    parentId: localParentId,
  };
}

export function pageMetadataConflictStatus(
  state: PageMetadataConflictState,
  field: PageMetadataField,
) {
  const current = toPageFormValuesFromDTO(state.details.current.page);
  return classifyConflictValue(
    state.baseline[field],
    current[field],
    state.local[field],
    equalJsonValue,
  );
}

export function hasCompletePageMetadataConflictChoices(
  state: PageMetadataConflictState,
  choices: PageMetadataConflictChoices,
): boolean {
  return PAGE_METADATA_CONFLICT_FIELDS.every((field) =>
    pageMetadataConflictStatus(state, field) !== "conflict" ||
    choices[field] !== undefined,
  );
}

export function choosePageMetadataConflict(
  choices: PageMetadataConflictChoices,
  field: PageMetadataField,
  choice: ConflictResolutionChoice,
): PageMetadataConflictChoices {
  return { ...choices, [field]: choice };
}

export function resolvePageMetadataConflictValues(input: Readonly<{
  state: PageMetadataConflictState;
  choices: PageMetadataConflictChoices;
  localParentId: PageFormValues["parentId"];
}>): PageMetadataConflictResolution {
  const current = currentPageMetadataValues(input.state, input.localParentId);
  const values = { ...current };
  const missingFields: PageMetadataField[] = [];

  for (const field of PAGE_METADATA_CONFLICT_FIELDS) {
    const status = pageMetadataConflictStatus(input.state, field);
    if (status === "conflict" && input.choices[field] === undefined) {
      missingFields.push(field);
      continue;
    }
    if (
      status === "local-only" ||
      (status === "conflict" && input.choices[field] === "local")
    ) {
      Object.assign(values, { [field]: input.state.local[field] });
    }
  }

  return missingFields.length > 0
    ? { status: "incomplete", missingFields }
    : { status: "resolved", values };
}
