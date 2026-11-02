import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { firstSchemaMessage } from "@/modules/schema";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().trim().min(1).max(255),
    auth: z.string().trim().min(1).max(255),
  }),
});

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: corsHeaders });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstSchemaMessage(parsed.error) }, { status: 400, headers: corsHeaders });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        tenantId: tenant.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      update: {
        tenantId: tenant.id,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("push subscribe failed", error);
    return NextResponse.json({ error: "Die Erlaubnis konnte nicht gespeichert werden." }, { status: 500, headers: corsHeaders });
  }
}
