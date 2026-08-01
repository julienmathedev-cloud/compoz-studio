/**
 * @file apps/studio/src/app/api/internal/demo/cleanup/cron-auth.ts
 * @layer studio/app/api
 * @description Authorization helpers for the demo cleanup cron endpoint.
 */

export function isAuthorizedCronRequest(
  request: Request,
  cronSecret: string | undefined = process.env["CRON_SECRET"],
): boolean {
  const expectedSecret = String(cronSecret ?? "").trim();
  const authorization = String(request.headers.get("authorization") ?? "").trim();
  const receivedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  return Boolean(expectedSecret && receivedSecret && receivedSecret === expectedSecret);
}
