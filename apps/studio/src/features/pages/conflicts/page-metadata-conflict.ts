/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict.ts
 * @layer studio/features/pages/conflicts
 * @description Pure state transitions for page metadata conflict resolution.
 */

import type { PageMetadataConflictDetails } from "@compoz/infra/lib/get-page-metadata-conflict-details";
import { toPageFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

export type PageMetadataConflictChoice =
  | "keepLocal"
  | "adoptRemote"
  | "restoreInitial";

export type PageMetadataConflictState = Readonly<{
  details: PageMetadataConflictDetails;
  initialBaseline: PageFormValues;
  occBaseline: PageFormValues;
  unresolvedFields: ReadonlyArray<
    PageMetadataConflictDetails["conflicts"][number]["field"]
  >;
}>;

export type PageMetadataConflictResolution = Readonly<{
  state: PageMetadataConflictState;
  field: PageMetadataConflictDetails["conflicts"][number]["field"];
  localValue: PageFormValues[keyof PageFormValues];
}>;

export function hasUnresolvedPageMetadataConflicts(
  state: PageMetadataConflictState | null | undefined,
): boolean {
  return Boolean(state && state.unresolvedFields.length > 0);
}

export function finalizePageMetadataConflictValues(
  state: PageMetadataConflictState,
  localValues: PageFormValues,
): PageFormValues {
  const remoteValues = toPageFormValuesFromDTO(
    state.details.current.page,
  );

  return {
    ...remoteValues,
    parentId: localValues.parentId,
  };
}

export function createPageMetadataConflictState(
  details: PageMetadataConflictDetails,
  initialBaseline: PageFormValues,
): PageMetadataConflictState {
  return {
    details,
    initialBaseline,
    occBaseline: initialBaseline,
    unresolvedFields: details.conflicts.map((item) => item.field),
  };
}

export function resolvePageMetadataConflictChoice(input: Readonly<{
  state: PageMetadataConflictState;
  field: PageMetadataConflictDetails["conflicts"][number]["field"];
  choice: PageMetadataConflictChoice;
  localValues: PageFormValues;
}>): PageMetadataConflictResolution {
  const remoteValues = toPageFormValuesFromDTO(
    input.state.details.current.page,
  );
  const remoteValue = remoteValues[input.field];
  const localValue =
    input.choice === "adoptRemote"
      ? remoteValue
      : input.choice === "restoreInitial"
        ? input.state.initialBaseline[input.field]
        : input.localValues[input.field];

  return {
    field: input.field,
    localValue,
    state: {
      ...input.state,
      occBaseline: {
        ...input.state.occBaseline,
        [input.field]: remoteValue,
      },
      unresolvedFields: input.state.unresolvedFields.filter(
        (field) => field !== input.field,
      ),
    },
  };
}
