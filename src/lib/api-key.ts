import { timingSafeEqual } from "node:crypto";

export function extractProvidedKey(request: Request): string | null {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey !== null) return headerKey.trim();

  const authorization = request.headers.get("authorization");
  if (!authorization) return null;

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match ? match[1].trim() : null;
}

function keysMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

/** A tenant key matches that one shop. The master key matches every shop. */
export function acceptsApiKey(provided: string, tenantKey: string): boolean {
  if (keysMatch(provided, tenantKey)) return true;
  const master = process.env.MASTER_API_KEY?.trim() ?? "";
  if (!master) return false;
  return keysMatch(provided, master);
}
