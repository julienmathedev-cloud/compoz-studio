/**
 * @file packages/core/src/domain/pages/revisions/page-blocks-equality.ts
 * @layer core/domain/pages/revisions
 * @description Pure structural equality used by the typed block merge engine.
 */

export function pageBlockValueEquals(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right) return false;
  if (left === null || right === null) return false;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((value, index) =>
      pageBlockValueEquals(value, right[index]),
    );
  }

  if (typeof left !== "object" || typeof right !== "object") return false;

  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).filter(
    (key) => leftRecord[key] !== undefined,
  );
  const rightKeys = Object.keys(rightRecord).filter(
    (key) => rightRecord[key] !== undefined,
  );

  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(rightRecord, key) &&
      pageBlockValueEquals(leftRecord[key], rightRecord[key]),
  );
}
