/**
 * @file apps/studio/src/features/settings/_shared/revisioned-draft-snapshot.ts
 * @layer studio/features/settings
 *
 * @description
 * Pure, website-scoped lifecycle for revisioned draft snapshots used by Settings hooks.
 *
 * @remarks
 * - Every boundary clones through `structuredClone`, including explicit `undefined` properties.
 * - Load generations and snapshot identity prevent obsolete operations from becoming writable.
 */

export type DraftSnapshot<T> = Readonly<{
  websiteId: string;
  baseline: T;
  revision: number;
}>;

type DraftSnapshotLoad = Readonly<{
  generation: number;
}>;

export type DraftSnapshotSave<T> = Readonly<{
  snapshot: DraftSnapshot<T>;
  baseline: T;
  expectedRevision: number;
}>;

type CommitLoadInput<T> = Readonly<{
  websiteId: string;
  baseline: T;
  revision: number;
  writable: boolean;
  isWebsiteCurrent: () => boolean;
}>;

type CommitSaveInput<T> = Readonly<{
  websiteId: string;
  baseline: T;
  revision: number;
  isWebsiteCurrent: () => boolean;
}>;

export class RevisionedDraftSnapshot<T> {
  private generation = 0;
  private snapshot: DraftSnapshot<T> | null = null;

  /** Invalidates any writable draft before a settings-bundle read begins. */
  beginLoad(): DraftSnapshotLoad {
    this.generation += 1;
    this.snapshot = null;

    return { generation: this.generation };
  }

  /**
   * Installs only the latest draft load for the currently selected website.
   * Published reads return isolated form values without installing a writable snapshot.
   */
  commitLoad(
    load: DraftSnapshotLoad,
    input: CommitLoadInput<T>,
  ): T | null {
    if (
      load.generation !== this.generation ||
      !input.isWebsiteCurrent()
    ) {
      return null;
    }

    if (input.writable) {
      this.snapshot = {
        websiteId: input.websiteId,
        baseline: cloneRevisionedDraftValue(input.baseline),
        revision: input.revision,
      };
    }

    return cloneRevisionedDraftValue(input.baseline);
  }

  /** Captures an immutable snapshot and an independent request baseline for a draft save. */
  captureForSave(websiteId: string): DraftSnapshotSave<T> | null {
    const snapshot = this.snapshot;

    if (!snapshot || snapshot.websiteId !== websiteId) {
      return null;
    }

    return {
      snapshot,
      baseline: cloneRevisionedDraftValue(snapshot.baseline),
      expectedRevision: snapshot.revision,
    };
  }

  /**
   * Commits a save only while its captured snapshot is still the active draft.
   * A `null` result means the persistence succeeded but the UI context became obsolete.
   */
  commitSave(
    save: DraftSnapshotSave<T>,
    input: CommitSaveInput<T>,
  ): T | null {
    if (
      this.snapshot !== save.snapshot ||
      save.snapshot.websiteId !== input.websiteId ||
      !input.isWebsiteCurrent()
    ) {
      return null;
    }

    this.snapshot = {
      websiteId: input.websiteId,
      baseline: cloneRevisionedDraftValue(input.baseline),
      revision: input.revision,
    };

    return cloneRevisionedDraftValue(input.baseline);
  }
}

export function cloneRevisionedDraftValue<T>(value: T): T {
  return structuredClone(value);
}

export function createRevisionedDraftSnapshot<T>(): RevisionedDraftSnapshot<T> {
  return new RevisionedDraftSnapshot<T>();
}

export function throwIfSettingsOperationAborted(
  signal?: AbortSignal,
): void {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

export function requireCurrentSettingsOperation<T>(value: T | null): T {
  if (value === null) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  return value;
}
