/**
 * Convex HTTP actions (httpRouter) are served on the deployment's
 * *.convex.site domain, while the client env var points at *.convex.cloud.
 * Derive the site URL once here so every fetch goes to the right host.
 */
export function convexHttpUrl(): string {
  const cloud = (import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "";
  return cloud.replace(".convex.cloud", ".convex.site");
}
