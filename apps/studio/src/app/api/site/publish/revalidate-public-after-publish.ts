/**
 * @file apps/studio/src/app/api/site/publish/revalidate-public-after-publish.ts
 * @layer studio/app/api
 * @description Bounded best-effort HTTP revalidation after a committed publication.
 * @remarks
 * Configuration is injected by the route so this primitive remains deterministic
 * and does not read runtime environment variables.
 */

import type { Logger } from "@compoz/infra/lib/log";

const DEFAULT_REVALIDATION_TIMEOUT_MS = 5_000;

type RevalidatePublicAfterPublishParams = Readonly<{
  siteBaseUrl?: string;
  websiteSlug: string;
  slugs: ReadonlyArray<string>;
  secret?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  logger: Pick<Logger, "debug" | "warn">;
}>;

function durationSince(startedAtMs: number, nowMs: () => number): number {
  return Math.max(0, nowMs() - startedAtMs);
}

/**
 * Triggers the public application's revalidation endpoint exactly once.
 * @throws A short technical error after logging an HTTP, network, or timeout failure.
 */
export async function revalidatePublicAfterPublish({
  siteBaseUrl,
  websiteSlug,
  slugs,
  secret,
  timeoutMs = DEFAULT_REVALIDATION_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
  nowMs = Date.now,
  logger,
}: RevalidatePublicAfterPublishParams): Promise<void> {
  const baseUrl = String(siteBaseUrl ?? "").trim();

  // Publishing remains valid when public revalidation is not configured.
  if (!baseUrl) return;

  const startedAtMs = nowMs();
  const controller = new AbortController();
  let timedOut = false;
  let httpFailure = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-revalidate-secret": secret } : {}),
      },
      body: JSON.stringify({ websiteSlug, slugs }),
      signal: controller.signal,
    });
    const durationMs = durationSince(startedAtMs, nowMs);

    if (!response.ok) {
      httpFailure = true;
      logger.warn("publish.revalidate.public.failed", {
        failureKind: "http",
        status: response.status,
        websiteSlug,
        slugsCount: slugs.length,
        durationMs,
        timeoutMs,
      });
      throw new Error("public_revalidate_http_failed");
    }

    logger.debug("publish.revalidate.public.succeeded", {
      websiteSlug,
      slugsCount: slugs.length,
      durationMs,
      timeoutMs,
      status: response.status,
    });
  } catch (error) {
    if (httpFailure) {
      throw error;
    }

    const durationMs = durationSince(startedAtMs, nowMs);
    const failureKind = timedOut ? "timeout" : "network";

    logger.warn("publish.revalidate.public.failed", {
      failureKind,
      websiteSlug,
      slugsCount: slugs.length,
      durationMs,
      timeoutMs,
    });
    throw new Error(
      failureKind === "timeout"
        ? "public_revalidate_timeout"
        : "public_revalidate_network_failed",
    );
  } finally {
    clearTimeout(timer);
  }
}
