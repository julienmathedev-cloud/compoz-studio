/**
 * @file apps/studio/src/features/settings/hooks/settings-save-deduplication.ts
 * @layer studio/features/settings/hooks
 * @description Serializes concurrent Settings save requests onto one in-flight promise.
 */

export class SettingsSaveDeduplicator<TResult> {
  private active: Promise<TResult> | null = null;

  run(start: () => Promise<TResult>): Promise<TResult> {
    if (this.active) return this.active;

    const promise = start();
    this.active = promise;
    const clear = () => {
      if (this.active === promise) this.active = null;
    };
    void promise.then(clear, clear);
    return promise;
  }
}
