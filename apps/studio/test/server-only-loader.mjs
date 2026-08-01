/**
 * @file apps/studio/test/server-only-loader.mjs
 * @description Test-only ESM resolver for Next.js's compile-time server-only marker.
 */

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      shortCircuit: true,
      url: "data:text/javascript,export%20%7B%7D%3B",
    };
  }

  return nextResolve(specifier, context);
}
