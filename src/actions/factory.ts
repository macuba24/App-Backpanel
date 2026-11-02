"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { readSavedAppLink, type SavedAppLink } from "@/lib/app-catalog";
import { faceFor } from "@/lib/app-face";
import { requireSessionTenant } from "@/lib/current-user";
import { editableTenantId } from "@/lib/editable-tenant";
import { readLocalConnection } from "@/lib/local-connection";
import { prisma } from "@/lib/prisma";
import { defaultFactory, factorySchema, parseFactory, type FactoryConfig } from "@/modules/factory";
import { firstSchemaMessage } from "@/modules/schema";

const LAHR_SITE = "https://www.schuh-frank.de/lahr-schuhe-koblenz";

function isGarten(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === "gartentechnik-koblenz.de";
  } catch {
    return false;
  }
}

/** A connected Lahr app keeps its shop address. The Schmahl homepage is not written over it. */
function shieldWebsite(factory: FactoryConfig, slug: string, link: SavedAppLink | null): FactoryConfig {
  if (slug !== "lahr") return factory;
  const fallback = link?.url && !isGarten(link.url) ? link.url : LAHR_SITE;
  const url = factory.homepage.url.trim();
  if (url && !isGarten(url)) return factory;
  return {
    ...factory,
    homepage: { enabled: true, label: factory.homepage.label || "Homepage", url: fallback },
  };
}

async function sessionLink(sessionTenantId: string): Promise<SavedAppLink | null> {
  const session = await prisma.tenant.findUnique({
    where: { id: sessionTenantId },
    select: {
      appConfig: { select: { connectedSlug: true, connectedName: true, connectedUrl: true } },
    },
  });
  return readSavedAppLink(session?.appConfig) ?? readLocalConnection(sessionTenantId);
}

async function writeFactory(value: unknown): Promise<ActionResult<{ factory: FactoryConfig }>> {
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const parsed = factorySchema.safeParse(value);
  if (!parsed.success) return { ok: false, error: firstSchemaMessage(parsed.error) };

  try {
    const targetId = await editableTenantId(scope.tenantId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: targetId },
      include: { appConfig: true },
    });
    if (!tenant?.appConfig) return { ok: false, error: "Die App-Konfiguration fehlt." };

    const factory = shieldWebsite(parsed.data, tenant.slug, await sessionLink(scope.tenantId));
    await prisma.appConfig.update({
      where: { tenantId: tenant.id },
      data: { factory },
    });
    revalidatePath("/", "layout");
    return { ok: true, factory };
  } catch (error) {
    console.error("writeFactory failed", error);
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
}

export async function saveFactory(_tenantId: unknown, input: unknown): Promise<ActionResult> {
  return writeFactory(input);
}

/** Changes only the homepage of the app the customer phones read. */
export async function saveWebsiteUrl(url: unknown): Promise<ActionResult<{ factory: FactoryConfig }>> {
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const targetId = await editableTenantId(scope.tenantId);
  const tenant = await prisma.tenant.findUnique({
    where: { id: targetId },
    include: { appConfig: true },
  });
  if (!tenant?.appConfig) return { ok: false, error: "Die App-Konfiguration fehlt." };

  const link = await sessionLink(scope.tenantId);
  const current =
    tenant.appConfig.factory != null
      ? parseFactory(tenant.appConfig.factory)
      : tenant.slug === "lahr"
        ? faceFor({ slug: "lahr", name: link?.name || "LAHR SCHUHE", url: link?.url || LAHR_SITE }).factory
        : parseFactory(defaultFactory);
  const nextUrl = typeof url === "string" ? url.trim() : "";
  return writeFactory({
    ...current,
    homepage: { ...current.homepage, url: nextUrl, enabled: nextUrl !== "" },
  });
}

export async function restoreFactory(): Promise<ActionResult<{ factory: FactoryConfig }>> {
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const targetId = await editableTenantId(scope.tenantId);
  const tenant = await prisma.tenant.findUnique({ where: { id: targetId }, select: { slug: true } });
  if (tenant?.slug === "lahr") {
    const link = await sessionLink(scope.tenantId);
    const url = link?.url && !isGarten(link.url) ? link.url : LAHR_SITE;
    return writeFactory(faceFor({ slug: "lahr", name: link?.name || "LAHR SCHUHE", url }).factory);
  }
  return writeFactory(parseFactory(defaultFactory));
}
