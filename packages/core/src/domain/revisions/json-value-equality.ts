/**
 * @file packages/core/src/domain/revisions/json-value-equality.ts
 * @layer core/domain/revisions
 * @description Structural equality for JSON-like persisted setting values.
 * @remarks Array order and the distinction between absent properties and explicit values are preserved.
 */

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function equalJsonValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => equalJsonValue(item, right[index]))
    );
  }

  if (!isRecord(left) || !isRecord(right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        equalJsonValue(left[key], right[key]),
    )
  );
}
