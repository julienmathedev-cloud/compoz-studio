/**
 * @file packages/core/src/domain/site/use-cases/_shared/update-revisioned-settings-section.ts
 * @layer core/domain/site/use-cases
 * @description Shared bounded retry and three-way merge for one settings section.
 * @remarks Callers retain their explicit fields, validator, resource identifier, and repository CAS primitive.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { compareThreeWayField } from "@compoz/core/domain/revisions/three-way-field";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

const MAX_CAS_ATTEMPTS = 3;

type RevisionedSectionInput<T extends object> = Readonly<{
  baseline: T;
  patch: Partial<T>;
  expectedRevision?: number;
}>;

type RevisionedSectionResult<T extends object> = Readonly<{
  settings: T;
  revision: number;
}>;

type UpdateRevisionedSettingsSectionOptions<T extends object> = Readonly<{
  repo: SiteRepository;
  input: RevisionedSectionInput<T>;
  resourceId: string;
  fields: readonly (keyof T & string)[];
  readCurrent: () => Promise<RevisionedSectionResult<T>>;
  compareAndSet: (
    expectedRevision: number,
    settings: T,
  ) => Promise<RevisionedSectionResult<T> | null>;
  equals?: (field: keyof T & string, left: unknown, right: unknown) => boolean;
  validate?: (settings: T) => void;
}>;

function hasOwnProperty<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export async function updateRevisionedSettingsSection<T extends object>(
  options: UpdateRevisionedSettingsSectionOptions<T>,
): Promise<RevisionedSectionResult<T>> {
  const { input } = options;

  if (input.expectedRevision === undefined) {
    throw new DomainError({ code: ERROR_CODES.REVISION_REQUIRED });
  }

  await options.repo.ensureBase();

  const local = { ...input.baseline, ...input.patch };

  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
    const current = await options.readCurrent();
    const merged = { ...current.settings };
    const conflictingPaths: string[] = [];

    for (const field of options.fields) {
      if (!hasOwnProperty(input.patch, field)) continue;

      const comparison = compareThreeWayField({
        path: field,
        baseline: input.baseline[field],
        current: current.settings[field],
        local: local[field],
        equals: (left, right) => options.equals?.(field, left, right) ?? Object.is(left, right),
      });

      if (comparison.classification === "conflict") {
        conflictingPaths.push(field);
      } else if (comparison.classification === "local-only") {
        Object.assign(merged, { [field]: local[field] });
      }
    }

    if (conflictingPaths.length > 0) {
      throw new DomainError({
        code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
        details: {
          resourceId: options.resourceId,
          expectedRevision: input.expectedRevision,
          currentRevision: current.revision,
          conflictingPaths,
        },
      });
    }

    const unchanged = options.fields.every((field) =>
      (options.equals?.(field, merged[field], current.settings[field]) ??
        Object.is(merged[field], current.settings[field])),
    );

    if (unchanged) return current;

    options.validate?.(merged);

    const persisted = await options.compareAndSet(current.revision, merged);
    if (persisted) return persisted;
  }

  throw new DomainError({ code: ERROR_CODES.CONFLICT });
}
