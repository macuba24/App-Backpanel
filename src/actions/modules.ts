"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { readSavedAppLink } from "@/lib/app-catalog";
import { requireSessionTenant } from "@/lib/current-user";
import { editableTenantId } from "@/lib/editable-tenant";
import { readLocalConnection } from "@/lib/local-connection";
import { deliverPush, pushKeysReady } from "@/lib/web-push";
import {
  applyModuleOrder,
  mergeActiveModules,
  normalizeModuleOrder,
  parseActiveModules,
  readModuleOrder,
  toInputJson,
} from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import {
  activeModulesPatchSchema,
  activeModulesSchema,
  firstSchemaMessage,
  pushCenterSchema,
  type PushCenterConfig,
} from "@/modules/schema";
import { geofenceSetupError } from "@/modules/geofence";
import { orderSlipSetupError } from "@/modules/order-slip";
import { weeklyOfferWindowError } from "@/modules/weekly-offer";

async function persistModules(tenantId: unknown, patch: unknown): Promise<ActionResult> {
  void tenantId;
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const parsedPatch = activeModulesPatchSchema.safeParse(patch);
  if (!parsedPatch.success) return { ok: false, error: firstSchemaMessage(parsedPatch.error) };

  if (parsedPatch.data.periodOffers) {
    const windowError = weeklyOfferWindowError(parsedPatch.data.periodOffers.week);
    if (windowError) return { ok: false, error: windowError };
  }

  if (parsedPatch.data.orderSlip) {
    const setupError = orderSlipSetupError(parsedPatch.data.orderSlip);
    if (setupError) return { ok: false, error: setupError };
  }

  if (parsedPatch.data.geofence) {
    const fenceError = geofenceSetupError(parsedPatch.data.geofence);
    if (fenceError) return { ok: false, error: fenceError };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: await editableTenantId(scope.tenantId) },
      include: { appConfig: true },
    });
    if (!tenant) return { ok: false, error: "Mandant wurde nicht gefunden." };

    const raw = tenant.appConfig?.activeModules ?? null;
    const current = parseActiveModules(raw);
    const order = readModuleOrder(raw);
    const next = applyModuleOrder(activeModulesSchema.parse(mergeActiveModules(current, parsedPatch.data)), order);

    if (tenant.appConfig) {
      await prisma.appConfig.update({
        where: { tenantId: tenant.id },
        data: { activeModules: toInputJson(next, order) },
      });
    } else {
      await prisma.appConfig.create({
        data: {
          tenantId: tenant.id,
          name: tenant.name,
          primaryColor: "#0f766e",
          welcomeMessage: "",
          activeModules: toInputJson(next, order),
        },
      });
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("saveActiveModules failed", error);
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
}

export async function saveActiveModules(tenantId: unknown, patch: unknown): Promise<ActionResult> {
  return persistModules(tenantId, patch);
}

/** Reorder modules. Settings and the enabled flag stay as they are. */
export async function saveModuleOrder(tenantId: unknown, order: unknown): Promise<ActionResult> {
  void tenantId;
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const parsed = z.array(z.string()).safeParse(order);
  if (!parsed.success) return { ok: false, error: "Die Reihenfolge ist ungültig." };

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: await editableTenantId(scope.tenantId) },
      include: { appConfig: true },
    });
    if (!tenant) return { ok: false, error: "Mandant wurde nicht gefunden." };

    const raw = tenant.appConfig?.activeModules ?? null;
    const current = parseActiveModules(raw);
    const nextOrder = normalizeModuleOrder(parsed.data, readModuleOrder(raw));
    const next = applyModuleOrder(current, nextOrder);
    const activeModules = toInputJson(next, nextOrder);

    if (tenant.appConfig) {
      await prisma.appConfig.update({
        where: { tenantId: tenant.id },
        data: { activeModules },
      });
    } else {
      await prisma.appConfig.create({
        data: {
          tenantId: tenant.id,
          name: tenant.name,
          primaryColor: "#0f766e",
          welcomeMessage: "",
          activeModules,
        },
      });
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("saveModuleOrder failed", error);
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
}

type PushAudience = { ok: true; tenantId: string; appName: string } | { ok: false; error: string };

/** The connected app receives the push. A saved link is never replaced by the signed-in shop. */
async function resolvePushAudience(sessionTenantId: string): Promise<PushAudience> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: sessionTenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      appConfig: {
        select: { name: true, connectedSlug: true, connectedName: true, connectedUrl: true },
      },
    },
  });
  if (!tenant) return { ok: false, error: "Nicht zugestellt: Mandant wurde nicht gefunden." };

  const link = readSavedAppLink(tenant.appConfig) ?? readLocalConnection(sessionTenantId);
  if (!link) {
    return { ok: true, tenantId: tenant.id, appName: tenant.appConfig?.name?.trim() || tenant.name };
  }

  const connected = await prisma.tenant.findUnique({
    where: { slug: link.slug },
    select: { id: true },
  });
  if (!connected) {
    return {
      ok: false,
      error: `Nicht zugestellt: Die verbundene App „${link.name}“ ist keinem Mandanten zugeordnet. Es wurde nichts an einen anderen Shop gesendet.`,
    };
  }
  return { ok: true, tenantId: connected.id, appName: link.name };
}

function deliveryFailure(appName: string, removed: number, failed: number, reason: string | null): string {
  if (removed > 0 && failed === 0) {
    return `Nicht zugestellt: Die gespeicherten Endgeräte von ${appName} sind abgelaufen.`;
  }
  return `Nicht zugestellt: ${reason ?? "Der Push-Dienst hat die Nachricht nicht angenommen."} Nichts an die Nutzer von ${appName} zugestellt.`;
}

function deliveryNotice(appName: string, sent: number, devices: number, failed: number, reason: string | null): string {
  if (failed === 0) {
    return sent === 1 ? `Gesendet an 1 Nutzer von ${appName}.` : `Gesendet an ${sent} Nutzer von ${appName}.`;
  }
  const why = reason ?? "Der Push-Dienst hat einen Teil abgelehnt.";
  return `Gesendet an ${sent} von ${devices} Nutzern von ${appName}. ${failed} nicht zugestellt: ${why}`;
}

export async function queuePushMessage(
  tenantId: unknown,
  pushCenter: unknown,
): Promise<ActionResult<{ lastQueuedAt: string; sent: number; devices: number }>> {
  const parsed = pushCenterSchema.safeParse(pushCenter);
  if (!parsed.success) return { ok: false, error: firstSchemaMessage(parsed.error) };

  if (!parsed.data.enabled) {
    return { ok: false, error: "Mitteilungen sind ausgeschaltet. Stellen Sie den Schalter auf Ein und speichern Sie." };
  }
  if (!parsed.data.title.trim() || !parsed.data.message.trim()) {
    return { ok: false, error: "Titel und Nachrichtentext sind erforderlich." };
  }
  if (!pushKeysReady()) {
    return { ok: false, error: "Die Push-Schlüssel fehlen auf dem Server." };
  }

  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const audience = await resolvePushAudience(scope.tenantId);
  if (!audience.ok) return audience;

  const lastQueuedAt = new Date().toISOString();
  const queued: PushCenterConfig = { ...parsed.data, lastQueuedAt };
  const saved = await persistModules(tenantId, { pushCenter: queued });
  if (!saved.ok) return saved;

  const devices = await prisma.pushSubscription.findMany({ where: { tenantId: audience.tenantId } });
  const delivery = await deliverPush(devices, {
    title: parsed.data.title.trim(),
    message: parsed.data.message.trim(),
    url: parsed.data.deepLink.trim() || "./",
  });
  if (delivery.removed.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: delivery.removed } } });
  }
  return { ok: true, lastQueuedAt, sent: delivery.sent, devices: devices.length };
}

/** Delivers the current push at once to users of the connected app. No schedule and no wait. */
export async function sendPushImmediately(
  tenantId: unknown,
  pushCenter: unknown,
): Promise<ActionResult<{ lastQueuedAt: string; sent: number; appName: string; notice: string }>> {
  void tenantId;
  const parsed = pushCenterSchema.safeParse(pushCenter);
  if (!parsed.success) return { ok: false, error: `Nicht zugestellt: ${firstSchemaMessage(parsed.error)}` };

  if (!parsed.data.enabled) {
    return { ok: false, error: "Nicht zugestellt: Mitteilungen sind ausgeschaltet." };
  }
  if (!parsed.data.title.trim() || !parsed.data.message.trim()) {
    return { ok: false, error: "Nicht zugestellt: Titel und Nachrichtentext sind erforderlich." };
  }

  const scope = await requireSessionTenant();
  if (!scope.ok) return { ok: false, error: `Nicht zugestellt: ${scope.error}` };

  const audience = await resolvePushAudience(scope.tenantId);
  if (!audience.ok) return audience;

  if (!pushKeysReady()) {
    return {
      ok: false,
      error: `Nicht zugestellt: Die Push-Schlüssel fehlen auf dem Server. Nichts an die Nutzer von ${audience.appName} gesendet.`,
    };
  }

  const devices = await prisma.pushSubscription.findMany({ where: { tenantId: audience.tenantId } });
  if (devices.length === 0) {
    return { ok: false, error: `Nicht zugestellt: Kein Nutzer von ${audience.appName} hat Mitteilungen erlaubt.` };
  }

  const delivery = await deliverPush(devices, {
    title: parsed.data.title.trim(),
    message: parsed.data.message.trim(),
    url: parsed.data.deepLink.trim() || "./",
  });
  if (delivery.removed.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: delivery.removed } } });
  }
  if (delivery.sent === 0) {
    return { ok: false, error: deliveryFailure(audience.appName, delivery.removed.length, delivery.failed, delivery.reason) };
  }

  const lastQueuedAt = new Date().toISOString();
  await persistModules(scope.tenantId, { pushCenter: { ...parsed.data, lastQueuedAt } });
  return {
    ok: true,
    lastQueuedAt,
    sent: delivery.sent,
    appName: audience.appName,
    notice: deliveryNotice(audience.appName, delivery.sent, devices.length, delivery.failed, delivery.reason),
  };
}

export async function countPushDevices(): Promise<number> {
  const scope = await requireSessionTenant();
  if (!scope.ok) return 0;
  const audience = await resolvePushAudience(scope.tenantId);
  if (!audience.ok) return 0;
  return prisma.pushSubscription.count({ where: { tenantId: audience.tenantId } });
}
