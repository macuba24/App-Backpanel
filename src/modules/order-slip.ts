import { z } from "zod";

import type { OrderSlipConfig } from "@/modules/schema";

function httpsUrl(value: string): boolean {
  return z.string().url().safeParse(value).success && /^https?:\/\//.test(value);
}

/** What the merchant must fill before customers can place a paid order. */
export function orderSlipSetupError(slip: OrderSlipConfig): string | null {
  if (!slip.enabled) return null;
  if (!slip.paymentLabel) return "Name des Zahlungssystems ist erforderlich.";
  if (!slip.taxNote) return "Hinweis zur Steuer ist erforderlich.";
  if (slip.fulfillment !== "delivery" && !slip.pickupText) return "Abholhinweis ist erforderlich.";
  if (slip.fulfillment !== "pickup" && !slip.deliveryText) return "Lieferhinweis ist erforderlich.";
  if (!httpsUrl(slip.impressumUrl)) return "Link zum Impressum ist erforderlich.";
  if (!httpsUrl(slip.privacyUrl)) return "Link zum Datenschutz ist erforderlich.";
  if (!httpsUrl(slip.termsUrl)) return "Link zu den AGB ist erforderlich.";
  if (!httpsUrl(slip.withdrawalUrl)) return "Link zur Widerrufsbelehrung ist erforderlich.";
  return null;
}

export const orderLineSchema = z.object({
  article: z.string().trim().min(1, "Artikel ist erforderlich.").max(80, "Artikelname ist zu lang."),
  quantity: z.number().int().min(1, "Menge mindestens 1.").max(99, "Menge höchstens 99."),
  unitPriceCents: z.number().int().min(0).max(100_000_00),
});

export const orderRequestSchema = z.object({
  lines: z.array(orderLineSchema).min(1, "Bitte tragen Sie mindestens einen Artikel ein.").max(20),
  fulfillment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().trim().max(500, "Adresse ist zu lang."),
  termsAccepted: z.boolean(),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;

export function orderRequestError(slip: OrderSlipConfig, input: OrderRequestInput): string | null {
  const setup = orderSlipSetupError(slip);
  if (!slip.enabled || setup) return "Der Bestellzettel ist noch nicht freigegeben.";
  if (input.termsAccepted !== true) return "Bitte akzeptieren Sie die AGB.";
  if (slip.fulfillment === "pickup" && input.fulfillment !== "pickup") return "Dieses Geschäft bietet nur Abholung an.";
  if (slip.fulfillment === "delivery" && input.fulfillment !== "delivery") return "Dieses Geschäft bietet nur Lieferung an.";
  if (input.fulfillment === "delivery" && input.deliveryAddress.length < 5) {
    return "Bitte geben Sie die Lieferadresse an.";
  }
  const total = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  if (!Number.isSafeInteger(total) || total <= 0) return "Bitte tragen Sie Artikel, Menge und Preis ein.";
  return null;
}

export function orderTotalCents(input: OrderRequestInput): number {
  return input.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
}
