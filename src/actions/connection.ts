"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { recognizeAppLink, type SavedAppLink } from "@/lib/app-catalog";
import { databaseReachable } from "@/lib/database-ready";
import { writeLocalConnection } from "@/lib/local-connection";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const REJECTED: Record<string, string> = {
  empty: "Bitte einen QR-Code wählen oder den Link zur App einfügen.",
  wifi: "Dieser QR-Code ist ein WLAN-Zugang, keine App. Es wurde nichts verbunden.",
  contact: "Dieser QR-Code ist ein Kontakt, keine App. Es wurde nichts verbunden.",
  payment: "Dieser QR-Code ist eine Zahlung, keine App. Es wurde nichts verbunden.",
  "not-link": "Das ist kein Link zu einer App. Es wurde nichts verbunden.",
  unknown: "Diese Adresse gehört zu keiner bekannten App. Es wurde nichts verbunden.",
};

async function saveInDatabase(tenantId: string, app: SavedAppLink): Promise<void> {
  if (!(await databaseReachable())) return;
  try {
    await prisma.appConfig.update({
      where: { tenantId },
      data: {
        connectedSlug: app.slug,
        connectedName: app.name,
        connectedUrl: app.url,
      },
    });
  } catch {
    // The local file is already written. A database miss does not undo it.
  }
}

export async function saveAppConnection(raw: unknown): Promise<ActionResult<{ app: SavedAppLink }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Bitte melden Sie sich an." };

  const decision = recognizeAppLink(typeof raw === "string" ? raw : "");
  if (!decision.ok) return { ok: false, error: REJECTED[decision.reason] };

  try {
    writeLocalConnection(session.tenantId, decision.app);
  } catch (error) {
    console.error("saveAppConnection failed", error);
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  await saveInDatabase(session.tenantId, decision.app);
  revalidatePath("/", "layout");
  return { ok: true, app: decision.app };
}
