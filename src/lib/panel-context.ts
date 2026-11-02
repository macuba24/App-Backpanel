import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { connection } from "next/server";

import { readSavedAppLink, type SavedAppLink } from "@/lib/app-catalog";
import { databaseReachable } from "@/lib/database-ready";
import { readLocalConnection } from "@/lib/local-connection";
import { parseActiveModules } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parseFactory, type FactoryConfig } from "@/modules/factory";
import type { ActiveModulesConfig } from "@/modules/schema";

const DEFAULT_COLOR = "#0f766e";

export type PanelTenant = {
  id: string;
  name: string;
  slug: string;
  appName: string;
  apiKey: string;
  branding: {
    primaryColor: string;
    logoUrl: string;
    welcomeMessage: string;
  };
  modules: ActiveModulesConfig;
  factory: FactoryConfig;
  connection: SavedAppLink | null;
};

export type PanelContext =
  | { ok: false; unauthenticated: true }
  | { ok: false; unauthenticated: false; message: string; email: string; connection: SavedAppLink | null }
  | { ok: true; email: string; displayName: string; current: PanelTenant };

const DB_ERROR =
  "Die Datenbank ist nicht erreichbar. Starten Sie PostgreSQL mit Docker Compose und führen Sie danach „npx prisma db push“ sowie das Seed aus.";

function offlineContext(session: { email: string; tenantId: string }): PanelContext {
  return {
    ok: false,
    unauthenticated: false,
    message: DB_ERROR,
    email: session.email,
    connection: readLocalConnection(session.tenantId),
  };
}

export const getPanelContext = cache(async (): Promise<PanelContext> => {
  await connection();

  const session = await getSession();
  if (!session) return { ok: false, unauthenticated: true };
  if (!(await databaseReachable())) return offlineContext(session);

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        tenant: { include: { appConfig: true } },
      },
    });

    if (!user || user.tenantId !== session.tenantId) {
      redirect("/api/session/end");
    }

    const account = user.tenant;
    const connection = readSavedAppLink(account.appConfig) ?? readLocalConnection(account.id);
    const linked =
      connection && connection.slug !== account.slug
        ? await prisma.tenant.findUnique({
            where: { slug: connection.slug },
            include: { appConfig: true },
          })
        : null;
    const tenant = linked ?? account;

    return {
      ok: true,
      email: user.email,
      displayName: user.name.trim() || user.email,
      current: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        appName: tenant.appConfig?.name?.trim() || tenant.name,
        apiKey: tenant.apiKey,
        branding: {
          primaryColor: tenant.appConfig?.primaryColor ?? DEFAULT_COLOR,
          logoUrl: tenant.appConfig?.logoUrl ?? "",
          welcomeMessage: tenant.appConfig?.welcomeMessage ?? "",
        },
        modules: parseActiveModules(tenant.appConfig?.activeModules ?? null),
        factory: parseFactory(tenant.appConfig?.factory ?? null),
        connection,
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    return offlineContext(session);
  }
});
