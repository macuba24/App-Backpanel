import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "bp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionPayload = {
  userId: string;
  tenantId: string;
  email: string;
  exp: number;
};

export function sessionSecret(): string | null {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value || value.length < 16) return null;
  return value;
}

function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function signSession(input: { userId: string; tenantId: string; email: string }): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const payload: SessionPayload = {
    userId: input.userId,
    tenantId: input.tenantId,
    email: input.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signBody(body, secret)}`;
}

export function readSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signBody(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof parsed.userId !== "string" || !UUID.test(parsed.userId)) return null;
    if (typeof parsed.tenantId !== "string" || !UUID.test(parsed.tenantId)) return null;
    if (typeof parsed.email !== "string" || parsed.email.length === 0) return null;
    if (typeof parsed.exp !== "number" || parsed.exp * 1000 <= Date.now()) return null;
    return {
      userId: parsed.userId,
      tenantId: parsed.tenantId,
      email: parsed.email,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
