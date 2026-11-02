"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, writeSessionCookie } from "@/lib/session";

const GENERIC_ERROR = "E-Mail oder Passwort ist falsch.";
const DATABASE_ERROR = "Die Anmeldung kann gerade nicht geprüft werden. Die Datenbank antwortet nicht.";
const CONFIG_ERROR = "Die Anmeldung ist serverseitig nicht konfiguriert.";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

function databaseUnavailable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String(error.code) : "";
  if (code.startsWith("P10") || code === "P2021") return true;
  const message = error instanceof Error ? error.message : "";
  return /can't reach database server|econnrefused|server has closed the connection|timeout/i.test(message);
}

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true, tenantId: true },
    });

    if (!user) return { ok: false, error: GENERIC_ERROR };

    const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!matches) return { ok: false, error: GENERIC_ERROR };

    const stored = await writeSessionCookie({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
    });
    if (!stored) return { ok: false, error: CONFIG_ERROR };
    return { ok: true };
  } catch (error) {
    console.error("login failed", error);
    if (databaseUnavailable(error)) return { ok: false, error: DATABASE_ERROR };
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
