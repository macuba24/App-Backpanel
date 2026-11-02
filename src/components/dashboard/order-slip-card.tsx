"use client";

import { useEffect, useState } from "react";

import { listOrderRequests, type StoredOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AreaField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey, OrderSlipConfig } from "@/modules/schema";

const category = categoryRegistry.find((item) => item.id === "order");

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

function euro(cents: number): string {
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function OrderSlipCard({ config, disabled, onPatch, onSave }: CardProps) {
  const t = useT();
  const slip = config.orderSlip;
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  if (!category) return null;

  function patch(next: Partial<OrderSlipConfig>) {
    onPatch("orderSlip", { ...slip, ...next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Order")}</CardTitle>
        <CardDescription>
          {t(
            category.description,
            "Order slip. Payment stays with the shop's own payment system.",
          )}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent>
          <section
            {...moduleAnchor(
              "orderSlip",
              `grid gap-4 rounded-xl border-2 border-black p-4 ${slip.enabled ? "feature-integrated" : ""}`,
            )}
          >
            <SwitchRow
              id="order-slip-enabled"
              label={t("Bestellzettel", "Order slip")}
              description={t(
                "Der Kunde sieht Preis, Abholung oder Lieferung und die Pflichtangaben, bevor er bestellt.",
                "The customer sees price, pickup or delivery and the legal notices before ordering.",
              )}
              checked={slip.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => patch({ enabled })}
            />
            {slip.enabled ? (
              <div className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Kartendaten laufen nicht über dieses Panel. Der Button in der App heißt fest „zahlungspflichtig bestellen“. Die AGB-Checkbox startet leer.",
                    "Card details do not pass through this panel. The app button is fixed as “zahlungspflichtig bestellen”. The terms checkbox starts empty.",
                  )}
                </p>
                <TextField
                  id="order-slip-title"
                  label={t("Titel", "Title")}
                  value={slip.title}
                  disabled={disabled}
                  onChange={(title) => patch({ title })}
                />
                <AreaField
                  id="order-slip-note"
                  label={t("Hinweis auf dem Zettel", "Note on the slip")}
                  value={slip.note}
                  disabled={disabled}
                  onChange={(note) => patch({ note })}
                />
                <TextField
                  id="order-slip-payment-label"
                  label={t("Name Ihres Zahlungssystems", "Name of your payment system")}
                  placeholder={t("z. B. PayPal, Überweisung, an der Kasse", "e.g. PayPal, bank transfer, at the till")}
                  value={slip.paymentLabel}
                  disabled={disabled}
                  onChange={(paymentLabel) => patch({ paymentLabel })}
                />
                <AreaField
                  id="order-slip-payment-instructions"
                  label={t("Zahlungsanweisung", "Payment instructions")}
                  value={slip.paymentInstructions}
                  disabled={disabled}
                  onChange={(paymentInstructions) => patch({ paymentInstructions })}
                />
                <TextField
                  id="order-slip-payment-url"
                  label={t("Link zu Ihrem Zahlungssystem", "Link to your payment system")}
                  type="url"
                  placeholder="https://"
                  value={slip.paymentUrl}
                  disabled={disabled}
                  onChange={(paymentUrl) => patch({ paymentUrl })}
                />
                <div className="grid gap-2">
                  <Label htmlFor="order-slip-fulfillment">{t("Abholung oder Lieferung", "Pickup or delivery")}</Label>
                  <select
                    id="order-slip-fulfillment"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={slip.fulfillment}
                    disabled={disabled}
                    onChange={(event) => patch({ fulfillment: event.target.value as OrderSlipConfig["fulfillment"] })}
                  >
                    <option value="pickup">{t("Nur Abholung", "Pickup only")}</option>
                    <option value="delivery">{t("Nur Lieferung", "Delivery only")}</option>
                    <option value="both">{t("Abholung oder Lieferung", "Pickup or delivery")}</option>
                  </select>
                </div>
                {slip.fulfillment !== "delivery" ? (
                  <AreaField
                    id="order-slip-pickup"
                    label={t("Abholhinweis", "Pickup note")}
                    value={slip.pickupText}
                    disabled={disabled}
                    onChange={(pickupText) => patch({ pickupText })}
                  />
                ) : null}
                {slip.fulfillment !== "pickup" ? (
                  <AreaField
                    id="order-slip-delivery"
                    label={t("Lieferhinweis", "Delivery note")}
                    value={slip.deliveryText}
                    disabled={disabled}
                    onChange={(deliveryText) => patch({ deliveryText })}
                  />
                ) : null}
                <TextField
                  id="order-slip-tax"
                  label={t("Hinweis zur Steuer", "Tax note")}
                  value={slip.taxNote}
                  disabled={disabled}
                  onChange={(taxNote) => patch({ taxNote })}
                />
                <TextField
                  id="order-slip-impressum"
                  label={t("Link zum Impressum", "Legal notice link")}
                  type="url"
                  placeholder="https://"
                  value={slip.impressumUrl}
                  disabled={disabled}
                  onChange={(impressumUrl) => patch({ impressumUrl })}
                />
                <TextField
                  id="order-slip-privacy"
                  label={t("Link zum Datenschutz", "Privacy link")}
                  type="url"
                  placeholder="https://"
                  value={slip.privacyUrl}
                  disabled={disabled}
                  onChange={(privacyUrl) => patch({ privacyUrl })}
                />
                <TextField
                  id="order-slip-terms"
                  label={t("Link zu den AGB", "Terms link")}
                  type="url"
                  placeholder="https://"
                  value={slip.termsUrl}
                  disabled={disabled}
                  onChange={(termsUrl) => patch({ termsUrl })}
                />
                <TextField
                  id="order-slip-withdrawal"
                  label={t("Link zur Widerrufsbelehrung", "Withdrawal notice link")}
                  type="url"
                  placeholder="https://"
                  value={slip.withdrawalUrl}
                  disabled={disabled}
                  onChange={(withdrawalUrl) => patch({ withdrawalUrl })}
                />
                <OrderInbox orders={orders} onOrders={setOrders} />
              </div>
            ) : null}
          </section>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={disabled}>
            {t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function OrderInbox({ orders, onOrders }: { orders: StoredOrder[]; onOrders: (orders: StoredOrder[]) => void }) {
  const t = useT();
  useEffect(() => {
    void listOrderRequests().then(onOrders);
  }, [onOrders]);

  return (
    <div className="grid gap-2 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{t("Eingegangene Bestellungen", "Received orders")}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void listOrderRequests().then(onOrders)}>
          {t("Aktualisieren", "Refresh")}
        </Button>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Noch keine Bestellung.", "No order yet.")}</p>
      ) : (
        <ul className="grid gap-2 text-sm">
          {orders.map((order) => (
            <li key={order.id} className="rounded-md border px-3 py-2">
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleString("de-DE")} · {euro(order.totalCents)} · {order.paymentLabel}
              </p>
              <p>
                {order.fulfillment === "delivery" ? "Lieferung" : "Abholung"}
                {order.deliveryAddress ? ` · ${order.deliveryAddress}` : ""}
              </p>
              <p>{order.lines.map((line) => `${line.quantity}× ${line.article}`).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
