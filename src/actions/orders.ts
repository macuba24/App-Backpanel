"use server";

import { requireSessionTenant } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export type StoredOrderLine = {
  article: string;
  quantity: number;
  unitPriceCents: number;
};

export type StoredOrder = {
  id: string;
  fulfillment: string;
  deliveryAddress: string;
  totalCents: number;
  paymentLabel: string;
  createdAt: string;
  lines: StoredOrderLine[];
};

function readLines(value: unknown): StoredOrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const line = item as Record<string, unknown>;
    if (typeof line.article !== "string" || typeof line.quantity !== "number" || typeof line.unitPriceCents !== "number") {
      return [];
    }
    return [{ article: line.article, quantity: line.quantity, unitPriceCents: line.unitPriceCents }];
  });
}

export async function listOrderRequests(): Promise<StoredOrder[]> {
  const scope = await requireSessionTenant();
  if (!scope.ok) return [];

  const rows = await prisma.orderRequest.findMany({
    where: { tenantId: scope.tenantId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return rows.map((row) => ({
    id: row.id,
    fulfillment: row.fulfillment,
    deliveryAddress: row.deliveryAddress,
    totalCents: row.totalCents,
    paymentLabel: row.paymentLabel,
    createdAt: row.createdAt.toISOString(),
    lines: readLines(row.lines),
  }));
}
