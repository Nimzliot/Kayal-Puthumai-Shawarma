export const rateLimitWindowMs = 60_000;
export const rateLimitMax = 20;

export function buildSecurityHeaders() {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
    : "script-src 'self' 'unsafe-inline';";
  const connectSrc = isDevelopment
    ? "connect-src 'self' https: wss: ws:;"
    : "connect-src 'self' https: wss:;";

  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Content-Security-Policy":
      `default-src 'self'; img-src 'self' https: data: blob:; ${scriptSrc} style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; ${connectSrc}`
  };
}
