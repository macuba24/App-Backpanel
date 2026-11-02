import { readSavedAppLink } from "@/lib/app-catalog";
import { readLocalConnection } from "@/lib/local-connection";
import { prisma } from "@/lib/prisma";

/**
 * The signed-in shop keeps the connection.
 * Module, factory and design changes are stored on the connected app when that app is a tenant.
 */
export async function editableTenantId(sessionTenantId: string): Promise<string> {
  const session = await prisma.tenant.findUnique({
    where: { id: sessionTenantId },
    select: {
      appConfig: {
        select: { connectedSlug: true, connectedName: true, connectedUrl: true },
      },
    },
  });
  const link = readSavedAppLink(session?.appConfig) ?? readLocalConnection(sessionTenantId);
  if (!link?.slug) return sessionTenantId;

  const connected = await prisma.tenant.findUnique({
    where: { slug: link.slug },
    select: { id: true },
  });
  return connected?.id ?? sessionTenantId;
}
