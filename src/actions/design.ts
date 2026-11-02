"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { requireSessionTenant } from "@/lib/current-user";
import { editableTenantId } from "@/lib/editable-tenant";
import { prisma } from "@/lib/prisma";
import { parseActiveModules, toInputJson } from "@/lib/modules";
import { defaultActiveModules } from "@/modules/defaults";
import { designSchema, firstSchemaMessage } from "@/modules/schema";

export async function saveDesign(tenantId: unknown, input: unknown): Promise<ActionResult> {
  void tenantId;
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const parsed = designSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstSchemaMessage(parsed.error) };

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: await editableTenantId(scope.tenantId) },
      include: { appConfig: true },
    });
    if (!tenant) return { ok: false, error: "Mandant wurde nicht gefunden." };

    const logoUrl = parsed.data.logoUrl === "" ? null : parsed.data.logoUrl;
    const modules = parseActiveModules(tenant.appConfig?.activeModules ?? defaultActiveModules);

    if (tenant.appConfig) {
      await prisma.appConfig.update({
        where: { tenantId: tenant.id },
        data: {
          primaryColor: parsed.data.primaryColor,
          logoUrl,
          welcomeMessage: parsed.data.welcomeMessage,
        },
      });
    } else {
      await prisma.appConfig.create({
        data: {
          tenantId: tenant.id,
          name: tenant.name,
          primaryColor: parsed.data.primaryColor,
          logoUrl,
          welcomeMessage: parsed.data.welcomeMessage,
          activeModules: toInputJson(modules),
        },
      });
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("saveDesign failed", error);
    return { ok: false, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
}
