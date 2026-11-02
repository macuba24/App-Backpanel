import { databaseReachable } from "@/lib/database-ready";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type SessionTenant =
  | { ok: true; userId: string; tenantId: string; email: string }
  | { ok: false; error: string };

/**
 * Loads the signed-in user and returns that user's tenant id.
 * A tenant id supplied by the client is never consulted.
 */
export async function requireSessionTenant(): Promise<SessionTenant> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Bitte melden Sie sich an." };
  if (!(await databaseReachable())) {
    return { ok: false, error: "Die Datenbank ist gerade nicht erreichbar. Die verbundene App bleibt erhalten." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, tenantId: true },
    });
    if (!user || user.tenantId !== session.tenantId) {
      return { ok: false, error: "Bitte melden Sie sich an." };
    }
    return { ok: true, userId: user.id, tenantId: user.tenantId, email: user.email };
  } catch {
    return { ok: false, error: "Die Datenbank ist gerade nicht erreichbar. Die verbundene App bleibt erhalten." };
  }
}
