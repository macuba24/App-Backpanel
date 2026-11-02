"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { restoreFactory, saveFactory } from "@/actions/factory";
import { AreaField, NumberField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/locale";
import { defaultFactory, type FactoryConfig } from "@/modules/factory";

function Block({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return (
    <section className={`grid gap-4 rounded-xl border-2 border-black p-4 ${enabled ? "feature-integrated" : ""}`}>
      {children}
    </section>
  );
}

export function FactoryForm({ tenantId, initial }: { tenantId: string; initial: FactoryConfig }) {
  const router = useRouter();
  const t = useT();
  const [factory, setFactory] = useState(initial);
  const [pending, setPending] = useState<"save" | "restore" | null>(null);

  function patch<K extends keyof FactoryConfig>(key: K, value: FactoryConfig[K]) {
    setFactory((current) => ({ ...current, [key]: value }));
  }

  async function onSave() {
    setPending("save");
    const result = await saveFactory(tenantId, factory);
    setPending(null);
    if (result.ok) {
      toast.success(t("Werkseinstellung gespeichert.", "Factory settings saved."));
      router.refresh();
      return;
    }
    toast.error(result.error);
  }

  async function onRestore() {
    setPending("restore");
    const result = await restoreFactory();
    setPending(null);
    if (result.ok) {
      setFactory("factory" in result && result.factory ? result.factory : defaultFactory);
      toast.success(t("Ausgangssituation wiederhergestellt.", "Delivered setup restored."));
      router.refresh();
      return;
    }
    toast.error(result.error);
  }

  const busy = pending !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Werkseinstellung", "Factory settings")}</CardTitle>
        <CardDescription>
          {t(
            "Das ist die Ausgangssituation der App. Was nicht gefällt, schalten Sie aus. Die Ausgangssituation holt den Auslieferungsstand zurück.",
            "This is the delivered setup of the app. Switch off anything you do not want. Restore brings back the delivered state.",
          )}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <CardContent className="grid gap-6">
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={() => void onRestore()}>
              {pending === "restore" ? t("Stellt zurück…", "Restoring…") : t("Ausgangssituation", "Restore setup")}
            </Button>
          </div>

          <Block enabled={factory.bonusBar.enabled}>
            <SwitchRow
              id="factory-bonus-bar"
              label={t("Bonusbalken", "Bonus bar")}
              description={t("Der Text darf {betrag} enthalten. Das ersetzt den noch fehlenden Umsatz.", "The text may contain {betrag}. That stands for the turnover still missing.")}
              checked={factory.bonusBar.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => patch("bonusBar", { ...factory.bonusBar, enabled })}
            />
            <TextField id="factory-bonus-next" label={t("Text bis zur nächsten Stufe", "Text until the next tier")} value={factory.bonusBar.nextText} disabled={busy} onChange={(nextText) => patch("bonusBar", { ...factory.bonusBar, nextText })} />
            <TextField id="factory-bonus-top" label={t("Text der höchsten Stufe", "Text of the top tier")} value={factory.bonusBar.topText} disabled={busy} onChange={(topText) => patch("bonusBar", { ...factory.bonusBar, topText })} />
          </Block>

          <Block enabled={factory.tiers.enabled}>
            <SwitchRow
              id="factory-tiers"
              label={t("Bonusstufen", "Bonus tiers")}
              description={t("Schwelle, Prozent und Text jeder Stufe.", "Threshold, percent and text of each tier.")}
              checked={factory.tiers.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => patch("tiers", { ...factory.tiers, enabled })}
            />
            {factory.tiers.items.map((tier, index) => (
              <div key={index} className="grid gap-3 rounded-lg border-2 border-black p-3 md:grid-cols-[8rem_8rem_1fr_auto] md:items-end">
                <NumberField id={`tier-euro-${index}`} label={t("Ab Euro", "From euro")} value={tier.amountEuro} min={1} disabled={busy} onChange={(amountEuro) => patch("tiers", { ...factory.tiers, items: factory.tiers.items.map((item, itemIndex) => itemIndex === index ? { ...item, amountEuro } : item) })} />
                <NumberField id={`tier-percent-${index}`} label={t("Prozent", "Percent")} value={tier.percent} min={0} max={100} disabled={busy} onChange={(percent) => patch("tiers", { ...factory.tiers, items: factory.tiers.items.map((item, itemIndex) => itemIndex === index ? { ...item, percent } : item) })} />
                <TextField id={`tier-text-${index}`} label={t("Text", "Text")} value={tier.text} disabled={busy} onChange={(text) => patch("tiers", { ...factory.tiers, items: factory.tiers.items.map((item, itemIndex) => itemIndex === index ? { ...item, text } : item) })} />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || factory.tiers.items.length <= 1}
                  onClick={() => patch("tiers", { ...factory.tiers, items: factory.tiers.items.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  {t("Wegnehmen", "Remove")}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={busy || factory.tiers.items.length >= 8}
              onClick={() => patch("tiers", { ...factory.tiers, items: [...factory.tiers.items, { amountEuro: 1000, percent: 1, text: t("Neuer Vorteil", "New benefit") }] })}
            >
              {t("Stufe hinzufügen", "Add tier")}
            </Button>
          </Block>

          <Block enabled={factory.name.enabled}>
            <SwitchRow id="factory-name" label={t("Name", "Name")} description={t("Feld in der Kundenanlage.", "Field when a customer is created.")} checked={factory.name.enabled} disabled={busy} onCheckedChange={(enabled) => patch("name", { ...factory.name, enabled })} />
            <TextField id="factory-name-label" label={t("Beschriftung", "Label")} value={factory.name.label} disabled={busy} onChange={(label) => patch("name", { ...factory.name, label })} />
          </Block>

          <Block enabled={factory.address.enabled}>
            <SwitchRow id="factory-address" label={t("Adresse", "Address")} description={t("Feld in der Kundenanlage.", "Field when a customer is created.")} checked={factory.address.enabled} disabled={busy} onCheckedChange={(enabled) => patch("address", { ...factory.address, enabled })} />
            <TextField id="factory-address-label" label={t("Beschriftung", "Label")} value={factory.address.label} disabled={busy} onChange={(label) => patch("address", { ...factory.address, label })} />
          </Block>

          <Block enabled={factory.birthday.enabled}>
            <SwitchRow id="factory-birthday" label={t("Geburtstag", "Birthday")} description={t("Tag und Monat in der Kundenanlage.", "Day and month when a customer is created.")} checked={factory.birthday.enabled} disabled={busy} onCheckedChange={(enabled) => patch("birthday", { ...factory.birthday, enabled })} />
            <TextField id="factory-birthday-label" label={t("Beschriftung", "Label")} value={factory.birthday.label} disabled={busy} onChange={(label) => patch("birthday", { ...factory.birthday, label })} />
          </Block>

          <Block enabled={factory.customerNumber.enabled}>
            <SwitchRow id="factory-number" label={t("Kundennummer", "Customer number")} description={t("Feld in der Kundenanlage.", "Field when a customer is created.")} checked={factory.customerNumber.enabled} disabled={busy} onCheckedChange={(enabled) => patch("customerNumber", { ...factory.customerNumber, enabled })} />
            <TextField id="factory-number-label" label={t("Beschriftung", "Label")} value={factory.customerNumber.label} disabled={busy} onChange={(label) => patch("customerNumber", { ...factory.customerNumber, label })} />
          </Block>

          <Block enabled={factory.customerCode.enabled}>
            <SwitchRow id="factory-code" label={t("Kunden-Code erzeugen", "Create customer code")} description={t("Erzeugt den Code als QR-Code auf dem Handy.", "Creates the code as a QR code on the phone.")} checked={factory.customerCode.enabled} disabled={busy} onCheckedChange={(enabled) => patch("customerCode", { ...factory.customerCode, enabled })} />
            <TextField id="factory-code-label" label={t("Button", "Button")} value={factory.customerCode.label} disabled={busy} onChange={(label) => patch("customerCode", { ...factory.customerCode, label })} />
            <TextField id="factory-code-hint" label={t("Hinweis", "Hint")} value={factory.customerCode.hint} disabled={busy} onChange={(hint) => patch("customerCode", { ...factory.customerCode, hint })} />
          </Block>

          <Block enabled={factory.receipt.enabled}>
            <SwitchRow id="factory-receipt" label={t("Rechnungsscanner", "Receipt scanner")} description={t("Der Kunde trägt den Betrag selbst ein. Der Kassenbon bleibt als Beleg gespeichert und kann kein zweites Mal zählen.", "The customer enters the amount. The receipt stays stored as proof and cannot count a second time.")} checked={factory.receipt.enabled} disabled={busy} onCheckedChange={(enabled) => patch("receipt", { ...factory.receipt, enabled })} />
            <TextField id="factory-receipt-title" label={t("Überschrift", "Heading")} value={factory.receipt.title} disabled={busy} onChange={(title) => patch("receipt", { ...factory.receipt, title })} />
            <AreaField id="factory-receipt-hint" label={t("Hinweis", "Hint")} value={factory.receipt.hint} disabled={busy} onChange={(hint) => patch("receipt", { ...factory.receipt, hint })} />
            <TextField id="factory-receipt-button" label={t("Button", "Button")} value={factory.receipt.buttonLabel} disabled={busy} onChange={(buttonLabel) => patch("receipt", { ...factory.receipt, buttonLabel })} />
          </Block>

          <Block enabled={factory.feedback.enabled}>
            <SwitchRow id="factory-feedback" label={t("Kundenfeedback", "Customer feedback")} description={t("Nachricht des Kunden an die Firma.", "Message from the customer to the company.")} checked={factory.feedback.enabled} disabled={busy} onCheckedChange={(enabled) => patch("feedback", { ...factory.feedback, enabled })} />
            <TextField id="factory-feedback-title" label={t("Überschrift", "Heading")} value={factory.feedback.title} disabled={busy} onChange={(title) => patch("feedback", { ...factory.feedback, title })} />
            <TextField id="factory-feedback-prompt" label={t("Fragetext", "Question")} value={factory.feedback.prompt} disabled={busy} onChange={(prompt) => patch("feedback", { ...factory.feedback, prompt })} />
          </Block>

          <Block enabled={factory.company.enabled}>
            <SwitchRow id="factory-company" label={t("Firmenadresse", "Company address")} description={t("Name, Anschrift und Telefonnummer unten in der App.", "Name, address and phone number at the bottom of the app.")} checked={factory.company.enabled} disabled={busy} onCheckedChange={(enabled) => patch("company", { ...factory.company, enabled })} />
            <TextField id="factory-company-name" label={t("Firma", "Company")} value={factory.company.name} disabled={busy} onChange={(name) => patch("company", { ...factory.company, name })} />
            <TextField id="factory-company-street" label={t("Straße", "Street")} value={factory.company.street} disabled={busy} onChange={(street) => patch("company", { ...factory.company, street })} />
            <TextField id="factory-company-district" label={t("Gebiet", "District")} value={factory.company.district} disabled={busy} onChange={(district) => patch("company", { ...factory.company, district })} />
            <div className="grid gap-3 md:grid-cols-2">
              <TextField id="factory-company-postal" label={t("Postleitzahl", "Postcode")} value={factory.company.postalCode} disabled={busy} onChange={(postalCode) => patch("company", { ...factory.company, postalCode })} />
              <TextField id="factory-company-city" label={t("Ort", "City")} value={factory.company.city} disabled={busy} onChange={(city) => patch("company", { ...factory.company, city })} />
            </div>
            <TextField id="factory-company-phone" label={t("Telefon", "Phone")} value={factory.company.phone} disabled={busy} onChange={(phone) => patch("company", { ...factory.company, phone })} />
            <AreaField id="factory-company-hours" label={t("Öffnungszeiten", "Opening hours")} value={factory.company.hours} disabled={busy} onChange={(hours) => patch("company", { ...factory.company, hours })} />
          </Block>

          <Block enabled={factory.homepage.enabled}>
            <SwitchRow id="factory-home" label={t("Webseite", "Website")} description={t("Diese URL steht in der Kunden-App. Bei einer Änderung tragen Sie die neue URL hier ein.", "This URL is shown in the customer app. When it changes, enter the new URL here.")} checked={factory.homepage.enabled} disabled={busy} onCheckedChange={(enabled) => patch("homepage", { ...factory.homepage, enabled })} />
            <TextField id="factory-home-label" label={t("Beschriftung", "Label")} value={factory.homepage.label} disabled={busy} onChange={(label) => patch("homepage", { ...factory.homepage, label })} />
            <TextField id="factory-home-url" label={t("URL der Webseite", "Website URL")} type="url" placeholder="https://" value={factory.homepage.url} disabled={busy} onChange={(url) => patch("homepage", { ...factory.homepage, url })} />
          </Block>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={busy}>
            {pending === "save" ? t("Speichert…", "Saving…") : t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
