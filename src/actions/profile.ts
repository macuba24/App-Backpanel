"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { getSession, writeSessionCookie } from "@/lib/session";

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Bitte einen Namen eingeben.").max(80),
    email: z.string().trim().email("Bitte eine gültige E-Mail eingeben."),
    currentPassword: z.string().min(1, "Bitte das aktuelle Passwort eingeben."),
    newPassword: z.string().max(200).optional().or(z.literal("")),
    confirmPassword: z.string().max(200).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    const next = value.newPassword ?? "";
    if (!next) return;
    if (next.length < 6) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Das neue Passwort braucht mindestens 6 Zeichen.",
      });
    }
    if (next !== (value.confirmPassword ?? "")) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Die Passwörter stimmen nicht überein.",
      });
    }
  });

export async function saveProfile(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Bitte melden Sie sich an." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Eingabe ist ungültig." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true, tenantId: true },
    });
    if (!user || user.tenantId !== session.tenantId) {
      return { ok: false, error: "Bitte melden Sie sich an." };
    }

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) return { ok: false, error: "Das aktuelle Passwort ist falsch." };

    const email = parsed.data.email.toLowerCase();
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken && taken.id !== user.id) {
      return { ok: false, error: "Diese E-Mail wird bereits verwendet." };
    }

    const nextPassword = parsed.data.newPassword?.trim() ?? "";
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        email,
        ...(nextPassword ? { passwordHash: await bcrypt.hash(nextPassword, 10) } : {}),
      },
    });

    await writeSessionCookie({ userId: user.id, tenantId: user.tenantId, email });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("saveProfile failed", error);
    return { ok: false, error: "Speichern fehlgeschlagen. Die Datenbank antwortet nicht." };
  }
}
