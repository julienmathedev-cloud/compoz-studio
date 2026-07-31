/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-resolution.ts
 * @layer studio/features/settings/conflicts
 * @description Pure OCC resolution helpers; controllers retain RHF and network ownership.
 */

import {
  classifyConflictValue,
  resolutionModeForStatus,
  type ConflictDisplayValue,
  type ConflictPresentationDetail,
  type ConflictPresentationGroup,
  type ConflictPresentationItem,
  type ConflictResolutionChoice,
  type ConflictValueEquality,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";

export type SettingsConflictSnapshot<T extends object> = Readonly<{
  baseline: T;
  local: T;
  current: T;
  currentRevision: number;
}>;

export type SettingsConflictFieldInput<TValue> = Readonly<{
  baseline: TValue;
  current: TValue;
  local: TValue;
  choices: Readonly<Record<string, ConflictResolutionChoice>>;
}>;

export type SettingsConflictFieldResolution<TValue> =
  | Readonly<{ status: "resolved"; value: TValue }>
  | Readonly<{ status: "incomplete"; missingChoices: readonly string[] }>
  | Readonly<{ status: "manual"; reason: string }>;

export type SettingsConflictFieldStrategy<TValue> = Readonly<{
  present: (input: SettingsConflictFieldInput<TValue>) => readonly ConflictPresentationItem[];
  resolve: (input: SettingsConflictFieldInput<TValue>) => SettingsConflictFieldResolution<TValue>;
}>;

export type SettingsConflictPresentationAdapter<T extends object> = Readonly<{
  labels: Readonly<Record<keyof T, string>>;
  display: <K extends keyof T>(key: K, value: T[K]) => ConflictDisplayValue;
  equals?: <K extends keyof T>(key: K, left: T[K], right: T[K]) => boolean;
  details?: <K extends keyof T>(key: K, baseline: T[K], server: T[K], local: T[K]) => readonly ConflictPresentationDetail[] | undefined;
  fieldStrategies?: Partial<{ [K in keyof T]: SettingsConflictFieldStrategy<T[K]> }>;
}>;

export function toSettingsConflictPresentation<T extends object>(input: Readonly<{
  snapshot: SettingsConflictSnapshot<T>;
  labels: Readonly<Record<keyof T, string>>;
  display: <K extends keyof T>(key: K, value: T[K]) => ConflictDisplayValue;
  choices?: Readonly<Record<string, ConflictResolutionChoice>>;
  equals?: <K extends keyof T>(key: K, left: T[K], right: T[K]) => boolean;
  details?: <K extends keyof T>(key: K, baseline: T[K], server: T[K], local: T[K]) => readonly ConflictPresentationDetail[] | undefined;
  fieldStrategies?: Partial<{ [K in keyof T]: SettingsConflictFieldStrategy<T[K]> }>;
}>): readonly ConflictPresentationGroup[] {
  const items = (Object.keys(input.labels) as (keyof T)[]).flatMap((key) => {
    const baseline = input.snapshot.baseline[key];
    const server = input.snapshot.current[key];
    const local = input.snapshot.local[key];
    const strategy = input.fieldStrategies?.[key];
    if (strategy) {
      return strategy.present({
        baseline,
        current: server,
        local,
        choices: input.choices ?? {},
      });
    }
    const equals: ConflictValueEquality<T[typeof key]> = input.equals
      ? (left, right) => input.equals?.(key, left, right) ?? false
      : equalJsonValue;
    const status = classifyConflictValue(baseline, server, local, equals);
    if (!status) return [];
    const id = String(key);
    return [{
      id,
      label: input.labels[key],
      status,
      resolutionMode: resolutionModeForStatus(status),
      choice: input.choices?.[id],
      comparison: {
        baseline: input.display(key, baseline),
        server: input.display(key, server),
        local: input.display(key, local),
      },
      details: input.details?.(key, baseline, server, local),
    }];
  });
  return [{ id: "settings", items }];
}

export type SettingsConflictResolutionResult<T extends object> =
  | Readonly<{ status: "resolved"; value: T }>
  | Readonly<{ status: "incomplete"; missingKeys: readonly string[] }>
  | Readonly<{ status: "manual"; field: keyof T; reason: string }>;

export function resolveSettingsConflictValues<T extends object>(input: Readonly<{
  snapshot: SettingsConflictSnapshot<T>;
  choices: Readonly<Record<string, ConflictResolutionChoice>>;
  equals?: <K extends keyof T>(key: K, left: T[K], right: T[K]) => boolean;
  fieldStrategies?: Partial<{ [K in keyof T]: SettingsConflictFieldStrategy<T[K]> }>;
}>): SettingsConflictResolutionResult<T> {
  const next = { ...input.snapshot.current } as T;
  const missingKeys: string[] = [];
  const keys = new Set<keyof T>([
    ...(Object.keys(input.snapshot.baseline) as (keyof T)[]),
    ...(Object.keys(input.snapshot.current) as (keyof T)[]),
    ...(Object.keys(input.snapshot.local) as (keyof T)[]),
  ]);
  for (const key of keys) {
    const strategy = input.fieldStrategies?.[key];
    if (strategy) {
      const result = strategy.resolve({
        baseline: input.snapshot.baseline[key],
        current: input.snapshot.current[key],
        local: input.snapshot.local[key],
        choices: input.choices,
      });
      if (result.status === "manual") {
        return { status: "manual", field: key, reason: result.reason };
      }
      if (result.status === "incomplete") {
        missingKeys.push(...result.missingChoices);
        continue;
      }
      next[key] = result.value;
      continue;
    }
    const equals: ConflictValueEquality<T[typeof key]> = input.equals
      ? (left, right) => input.equals?.(key, left, right) ?? false
      : equalJsonValue;
    const status = classifyConflictValue(
      input.snapshot.baseline[key],
      input.snapshot.current[key],
      input.snapshot.local[key], equals,
    );
    if (status === "conflict" && input.choices[String(key)] === undefined) {
      missingKeys.push(String(key));
      continue;
    }
    if (status === "local-only" || (status === "conflict" && input.choices[String(key)] === "local")) {
      next[key] = input.snapshot.local[key];
    }
  }
  return missingKeys.length > 0
    ? { status: "incomplete", missingKeys }
    : { status: "resolved", value: next };
}

export type SettingsConflictMutationPlan<T extends object> =
  | Readonly<{ status: "incomplete"; missingKeys: readonly string[] }>
  | Readonly<{ status: "manual"; field: keyof T; reason: string }>
  | Readonly<{ status: "noChanges"; value: T; baseline: T; expectedRevision: number }>
  | Readonly<{ status: "mutation"; value: T; baseline: T; expectedRevision: number; payload: Partial<T> | T; fields: readonly string[] }>;

export function buildSemanticSettingsPatch<T extends object>(input: Readonly<{
  current: T;
  resolved: T;
  fields: SettingsConflictPresentationAdapter<T>;
}>): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(input.fields.labels) as (keyof T)[]) {
    const equals = input.fields.equals
      ? input.fields.equals(key, input.current[key], input.resolved[key])
      : equalJsonValue(input.current[key], input.resolved[key]);
    if (!equals) patch[key] = input.resolved[key];
  }
  return patch;
}

export function buildSettingsConflictMutationPlan<T extends object>(input: Readonly<{
  snapshot: SettingsConflictSnapshot<T>;
  choices: Readonly<Record<string, ConflictResolutionChoice>>;
  normalize?: (value: T) => T;
  fields: SettingsConflictPresentationAdapter<T>;
}>): SettingsConflictMutationPlan<T> {
  const resolution = resolveSettingsConflictValues({
    snapshot: input.snapshot,
    choices: input.choices,
    equals: input.fields.equals,
    fieldStrategies: input.fields.fieldStrategies,
  });
  if (resolution.status === "incomplete" || resolution.status === "manual") return resolution;
  const value = input.normalize?.(resolution.value) ?? resolution.value;
  const payload = buildSemanticSettingsPatch({
    current: input.snapshot.current,
    resolved: value,
    fields: input.fields,
  });
  const fields = Object.keys(payload as Record<string, unknown>);
  if (fields.length === 0) {
    return {
      status: "noChanges",
      value,
      baseline: input.snapshot.current,
      expectedRevision: input.snapshot.currentRevision,
    };
  }
  return {
    status: "mutation",
    value,
    baseline: input.snapshot.current,
    expectedRevision: input.snapshot.currentRevision,
    payload,
    fields,
  };
}

export function buildSettingsWholeLocalMutationPlan<T extends object>(input: Readonly<{
  snapshot: SettingsConflictSnapshot<T>;
  normalize?: (value: T) => T;
  fields: SettingsConflictPresentationAdapter<T>;
}>): Exclude<SettingsConflictMutationPlan<T>, { status: "incomplete" | "manual" }> {
  const value = input.normalize?.(input.snapshot.local) ?? input.snapshot.local;
  const payload = buildSemanticSettingsPatch({
    current: input.snapshot.current,
    resolved: value,
    fields: input.fields,
  });
  const fields = Object.keys(payload as Record<string, unknown>);
  return fields.length === 0
    ? {
        status: "noChanges",
        value,
        baseline: input.snapshot.current,
        expectedRevision: input.snapshot.currentRevision,
      }
    : {
        status: "mutation",
        value,
        baseline: input.snapshot.current,
        expectedRevision: input.snapshot.currentRevision,
        payload,
        fields,
      };
}
