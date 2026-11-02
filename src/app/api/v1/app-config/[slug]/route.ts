import { NextResponse } from "next/server";

import { acceptsApiKey, extractProvidedKey } from "@/lib/api-key";
import { enabledModules, modulesForStorefront, parseActiveModules } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { parseFactory } from "@/modules/factory";

/**
 * Public storefront read.
 * If `x-api-key` or `Authorization: Bearer <apiKey>` is sent, it must match the tenant
 * or the master key, which is valid for every backpanel.
 * If neither credential is sent, the active configuration is readable without a key
 * so a customer PWA can load branding and enabled modules.
 */

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-api-key, authorization, content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { appConfig: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404, headers: { ...corsHeaders, "Cache-Control": "no-store" } },
      );
    }

    const providedKey = extractProvidedKey(request);
    if (providedKey !== null && !acceptsApiKey(providedKey, tenant.apiKey)) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401, headers: { ...corsHeaders, "Cache-Control": "no-store" } },
      );
    }

    const configured = modulesForStorefront(parseActiveModules(tenant.appConfig?.activeModules ?? null));
    const modules = enabledModules(configured);

    return NextResponse.json(
      {
        tenant: {
          name: tenant.name,
          slug: tenant.slug,
        },
        branding: {
          primaryColor: tenant.appConfig?.primaryColor ?? "#0f766e",
          logoUrl: tenant.appConfig?.logoUrl ?? null,
          welcomeMessage: tenant.appConfig?.welcomeMessage ?? "",
        },
        modules,
        order: Object.keys(modules),
        factory: parseFactory(tenant.appConfig?.factory ?? null),
        updatedAt: tenant.appConfig?.updatedAt?.toISOString() ?? null,
      },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/v1/app-config failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { ...corsHeaders, "Cache-Control": "no-store" } },
    );
  }
}
