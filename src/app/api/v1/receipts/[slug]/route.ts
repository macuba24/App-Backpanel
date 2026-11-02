import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-api-key, authorization",
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
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: corsHeaders });
    }

    const body: unknown = await request.json().catch(() => null);
    const hash = body && typeof body === "object" && "hash" in body && typeof body.hash === "string"
      ? body.hash.trim().toLowerCase()
      : "";
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      return NextResponse.json({ error: "Hash fehlt." }, { status: 400, headers: corsHeaders });
    }

    try {
      await prisma.receiptClaim.create({ data: { tenantId: tenant.id, hash } });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (code === "P2002") {
        return NextResponse.json(
          { error: "Diese Rechnung wurde schon erfasst." },
          { status: 409, headers: corsHeaders },
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("POST /api/v1/receipts failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
