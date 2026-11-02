"use client";

import { useMemo, useState } from "react";

import type { OrderSlipConfig } from "@/modules/schema";

type Line = { article: string; quantity: string; price: string };

function cents(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, "").replace("€", "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

function euro(value: number): string {
  return `${(value / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

const linkStyle = { color: "#111111", fontWeight: 700 } as const;

export function OrderSlipPreview({ slip }: { slip: OrderSlipConfig }) {
  const [lines, setLines] = useState<Line[]>([{ article: "", quantity: "1", price: "" }]);
  const [mode, setMode] = useState<"" | "pickup" | "delivery">(slip.fulfillment === "both" ? "" : slip.fulfillment);
  const [address, setAddress] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState("");

  const legal = [slip.impressumUrl, slip.privacyUrl, slip.termsUrl, slip.withdrawalUrl].every((url) =>
    /^https?:\/\//.test(url),
  );
  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = cents(line.price);
      const quantity = Number(line.quantity);
      if (price === null || !line.article.trim() || !Number.isInteger(quantity) || quantity < 1) return sum;
      return sum + price * quantity;
    }, 0);
  }, [lines]);
  const complete = lines.some((line) => line.article.trim() && Number(line.quantity) >= 1 && cents(line.price) !== null);
  const fulfillmentOk = mode === "pickup" || (mode === "delivery" && address.trim().length >= 5);
  const ready = legal && complete && total > 0 && fulfillmentOk && accepted;

  function patchLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
    setNotice("");
  }

  return (
    <article className="schmahl-benefit schmahl-slip">
      <p className="schmahl-benefit-title">{slip.title || "Bestellzettel"}</p>
      {slip.note ? <p>{slip.note}</p> : null}
      {lines.map((line, index) => (
        <div key={index} className="schmahl-slip-row">
          <input
            aria-label="Artikel"
            placeholder="Artikel"
            value={line.article}
            onChange={(event) => patchLine(index, { article: event.target.value })}
          />
          <input
            aria-label="Menge"
            inputMode="numeric"
            value={line.quantity}
            onChange={(event) => patchLine(index, { quantity: event.target.value })}
          />
          <input
            aria-label="Preis"
            inputMode="decimal"
            placeholder="0,00"
            value={line.price}
            onChange={(event) => patchLine(index, { price: event.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        className="schmahl-slip-quiet"
        onClick={() => setLines((current) => [...current, { article: "", quantity: "1", price: "" }])}
      >
        Zeile
      </button>
      <p className="schmahl-slip-sum">Gesamtpreis inklusive Steuer: {euro(total)}</p>
      <p>{slip.taxNote}</p>
      {slip.fulfillment !== "delivery" ? <p>Abholung: {slip.pickupText || "Hinweis fehlt"}</p> : null}
      {slip.fulfillment !== "pickup" ? <p>Lieferung: {slip.deliveryText || "Hinweis fehlt"}</p> : null}
      {slip.fulfillment === "both" ? (
        <div className="schmahl-slip-choice">
          <label>
            <input type="radio" name="preview-fulfillment" checked={mode === "pickup"} onChange={() => setMode("pickup")} /> Abholung
          </label>
          <label>
            <input type="radio" name="preview-fulfillment" checked={mode === "delivery"} onChange={() => setMode("delivery")} /> Lieferung
          </label>
        </div>
      ) : null}
      {mode === "delivery" ? (
        <textarea
          aria-label="Lieferadresse"
          placeholder="Lieferadresse"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      ) : null}
      <p>Zahlung: {slip.paymentLabel || "System des Geschäfts"}</p>
      {slip.paymentInstructions ? <p>{slip.paymentInstructions}</p> : null}
      <p className="schmahl-slip-links">
        <a href={slip.impressumUrl || undefined} style={linkStyle} target="_blank" rel="noreferrer">Impressum</a>
        <a href={slip.privacyUrl || undefined} style={linkStyle} target="_blank" rel="noreferrer">Datenschutz</a>
        <a href={slip.termsUrl || undefined} style={linkStyle} target="_blank" rel="noreferrer">AGB</a>
        <a href={slip.withdrawalUrl || undefined} style={linkStyle} target="_blank" rel="noreferrer">Widerrufsbelehrung</a>
      </p>
      <label className="schmahl-slip-check">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        <span>Ich habe die AGB gelesen und akzeptiere sie.</span>
      </label>
      <button
        type="button"
        className="schmahl-slip-pay"
        disabled={!ready}
        onClick={() => setNotice("Vorschau. Es wurde keine Bestellung gespeichert. Die Zahlung bleibt beim Geschäft.")}
      >
        zahlungspflichtig bestellen
      </button>
      {notice ? <p>{notice}</p> : null}
    </article>
  );
}
