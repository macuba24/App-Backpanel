import { NextResponse } from "next/server";

import { parseActiveModules } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { orderRequestError, orderRequestSchema, orderTotalCents } from "@/modules/order-slip";
import { firstSchemaMessage } from "@/modules/schema";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { appConfig: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: corsHeaders });
    }

    const slip = parseActiveModules(tenant.appConfig?.activeModules ?? null).orderSlip;
    const body: unknown = await request.json().catch(() => null);
    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstSchemaMessage(parsed.error) }, { status: 400, headers: corsHeaders });
    }

    const rejected = orderRequestError(slip, parsed.data);
    if (rejected) {
      return NextResponse.json({ error: rejected }, { status: 400, headers: corsHeaders });
    }

    const totalCents = orderTotalCents(parsed.data);
    await prisma.orderRequest.create({
      data: {
        tenantId: tenant.id,
        lines: parsed.data.lines,
        fulfillment: parsed.data.fulfillment,
        deliveryAddress: parsed.data.fulfillment === "delivery" ? parsed.data.deliveryAddress : "",
        totalCents,
        paymentLabel: slip.paymentLabel,
        termsAccepted: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        totalCents,
        paymentLabel: slip.paymentLabel,
        paymentUrl: slip.paymentUrl,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("order request failed", error);
    return NextResponse.json(
      { error: "Die Bestellung konnte nicht gespeichert werden." },
      { status: 500, headers: corsHeaders },
    );
  }
}
