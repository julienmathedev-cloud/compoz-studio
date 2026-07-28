/**
 * @file packages/core/src/domain/revisions/three-way-field.ts
 * @layer core/domain/revisions
 * @description Pure three-way comparison for one atomic revisioned field.
 */

export type ThreeWayFieldInput<T> = Readonly<{
  path: string;
  baseline: T;
  current: T;
  local: T;
  equals?: (left: T, right: T) => boolean;
}>;

export type ThreeWayFieldClassification =
  | "unchanged"
  | "local-only"
  | "server-only"
  | "same-change"
  | "conflict";

export type ThreeWayFieldResult<T> = Readonly<{
  path: string;
  classification: ThreeWayFieldClassification;
  baseline: T;
  current: T;
  local: T;
}>;

/**
 * Classifies concurrent changes to a single field without mutating either input.
 */
export function compareThreeWayField<T>(
  input: ThreeWayFieldInput<T>,
): ThreeWayFieldResult<T> {
  const equals = input.equals ?? Object.is;
  const currentMatchesBaseline = equals(input.current, input.baseline);
  const localMatchesBaseline = equals(input.local, input.baseline);
  const currentMatchesLocal = equals(input.current, input.local);

  let classification: ThreeWayFieldClassification;

  if (currentMatchesBaseline && localMatchesBaseline) {
    classification = "unchanged";
  } else if (currentMatchesBaseline) {
    classification = "local-only";
  } else if (localMatchesBaseline) {
    classification = "server-only";
  } else if (currentMatchesLocal) {
    classification = "same-change";
  } else {
    classification = "conflict";
  }

  return {
    path: input.path,
    classification,
    baseline: input.baseline,
    current: input.current,
    local: input.local,
  };
}
