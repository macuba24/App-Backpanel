"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DateField } from "@/components/dashboard/date-field";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { AreaField, NumberField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, BirthdayGreetingConfig, ModuleKey } from "@/modules/schema";

const category = categoryRegistry[2];

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

const discountOptions: { value: BirthdayGreetingConfig["discountType"]; label: string }[] = [
  { value: "percent", label: "Prozentual (%)" },
  { value: "fixed", label: "Festbetrag (€)" },
  { value: "gift", label: "Gratis-Geschenk" },
];

const barcodeOptions: { value: BirthdayGreetingConfig["barcodeType"]; label: string }[] = [
  { value: "QR_CODE", label: "QR-Code" },
  { value: "CODE128", label: "Code 128" },
  { value: "EAN13", label: "EAN-13" },
  { value: "TEXT_CODE", label: "Textcode" },
];

export function MarketingCard({ config, disabled, onPatch, onSave }: CardProps) {
  const t = useT();
  const valueLabel = config.birthdayGreeting.discountType === "gift" ? t("Geschenkbezeichnung", "Gift name") : t("Gutscheinwert", "Voucher value");
  const choice = (label: string) => {
    const english: Record<string, string> = {
      "Prozentual (%)": "Percent (%)",
      "Festbetrag (€)": "Fixed amount (€)",
      "Gratis-Geschenk": "Free gift",
    };
    return t(label, english[label] ?? label);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Personalized marketing")}</CardTitle>
        <CardDescription>{t(category.description, "Birthdays, seasonal messages and events.")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent className="grid gap-8">
          <section {...moduleAnchor("birthdayGreeting", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.birthdayGreeting.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="birthday-enabled"
              label={t("Automatisierter Geburtstagsgruß", "Automated birthday greeting")}
              description={t("Gruß und Gutschein, gültig ab dem Geburtstag für die angegebene Anzahl Tage.", "Greeting and voucher, valid from the birthday for the given number of days.")}
              checked={config.birthdayGreeting.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("birthdayGreeting", { ...config.birthdayGreeting, enabled })}
            />
            {config.birthdayGreeting.enabled ? (
              <div className="grid gap-4">
                <TextField
                  id="birthday-title"
                  label={t("Gruß-Titel", "Greeting title")}
                  placeholder="Alles Gute!"
                  value={config.birthdayGreeting.title}
                  disabled={disabled}
                  onChange={(title) => onPatch("birthdayGreeting", { ...config.birthdayGreeting, title })}
                />
                <AreaField
                  id="birthday-message"
                  label={t("Gruß-Nachricht", "Greeting message")}
                  value={config.birthdayGreeting.message}
                  disabled={disabled}
                  onChange={(message) => onPatch("birthdayGreeting", { ...config.birthdayGreeting, message })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="birthday-discount-type">{t("Rabatt-Typ", "Discount type")}</Label>
                    <Select
                      value={config.birthdayGreeting.discountType}
                      disabled={disabled}
                      onValueChange={(value) => {
                        if (value === "percent" || value === "fixed" || value === "gift") {
                          onPatch("birthdayGreeting", { ...config.birthdayGreeting, discountType: value });
                        }
                      }}
                    >
                      <SelectTrigger id="birthday-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {discountOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {choice(option.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField
                    id="birthday-value"
                    label={valueLabel}
                    value={config.birthdayGreeting.discountValue}
                    disabled={disabled}
                    onChange={(discountValue) => onPatch("birthdayGreeting", { ...config.birthdayGreeting, discountValue })}
                  />
                </div>
                <AreaField
                  id="birthday-terms"
                  label={t("Einlösebedingungen", "Redemption terms")}
                  placeholder="Gültig ab 50 € Einkaufswert"
                  value={config.birthdayGreeting.redemptionTerms}
                  disabled={disabled}
                  onChange={(redemptionTerms) => onPatch("birthdayGreeting", { ...config.birthdayGreeting, redemptionTerms })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="birthday-days"
                    label={t("Gültigkeit in Tagen", "Valid for days")}
                    hint={t("Tage ab dem Geburtstag.", "Days from the birthday.")}
                    value={config.birthdayGreeting.validDays}
                    min={1}
                    max={365}
                    disabled={disabled}
                    onChange={(validDays) => onPatch("birthdayGreeting", { ...config.birthdayGreeting, validDays })}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="birthday-barcode">{t("Barcode-Typ", "Barcode type")}</Label>
                    <Select
                      value={config.birthdayGreeting.barcodeType}
                      disabled={disabled}
                      onValueChange={(value) => {
                        if (value === "QR_CODE" || value === "CODE128" || value === "EAN13" || value === "TEXT_CODE") {
                          onPatch("birthdayGreeting", { ...config.birthdayGreeting, barcodeType: value });
                        }
                      }}
                    >
                      <SelectTrigger id="birthday-barcode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {barcodeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {choice(option.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <Separator />

          <section {...moduleAnchor("seasonalGreeting", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.seasonalGreeting.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="seasonal-enabled"
              label={t("Saison- & Weihnachtsgrüße", "Seasonal and Christmas greetings")}
              description={t("Banner, das nur im gewählten Zeitraum ausgespielt wird, wenn Daten gesetzt sind.", "A banner shown only in the chosen period when dates are set.")}
              checked={config.seasonalGreeting.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("seasonalGreeting", { ...config.seasonalGreeting, enabled })}
            />
            {config.seasonalGreeting.enabled ? (
              <div className="grid gap-4">
                <TextField
                  id="seasonal-title"
                  label={t("Banner-Titel", "Banner title")}
                  value={config.seasonalGreeting.bannerTitle}
                  disabled={disabled}
                  onChange={(bannerTitle) => onPatch("seasonalGreeting", { ...config.seasonalGreeting, bannerTitle })}
                />
                <AreaField
                  id="seasonal-text"
                  label={t("Text", "Text")}
                  value={config.seasonalGreeting.text}
                  disabled={disabled}
                  onChange={(text) => onPatch("seasonalGreeting", { ...config.seasonalGreeting, text })}
                />
                <TextField
                  id="seasonal-image"
                  label={t("Bild-URL", "Image URL")}
                  type="url"
                  placeholder="https://"
                  value={config.seasonalGreeting.imageUrl}
                  disabled={disabled}
                  onChange={(imageUrl) => onPatch("seasonalGreeting", { ...config.seasonalGreeting, imageUrl })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateField
                    id="seasonal-start"
                    label={t("Startdatum", "Start date")}
                    value={config.seasonalGreeting.startDate}
                    disabled={disabled}
                    onChange={(startDate) => onPatch("seasonalGreeting", { ...config.seasonalGreeting, startDate })}
                  />
                  <DateField
                    id="seasonal-end"
                    label={t("Enddatum", "End date")}
                    value={config.seasonalGreeting.endDate}
                    disabled={disabled}
                    onChange={(endDate) => onPatch("seasonalGreeting", { ...config.seasonalGreeting, endDate })}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <Separator />

          <section {...moduleAnchor("eventCalendar", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.eventCalendar.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="events-enabled"
              label={t("Event-Kalender", "Event calendar")}
              description={t("Mehrere Termine. Der Teilnahme-Button kann je Event aktiv sein.", "Several dates. The attendance button can be active per event.")}
              checked={config.eventCalendar.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("eventCalendar", { ...config.eventCalendar, enabled })}
            />
            {config.eventCalendar.enabled ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || config.eventCalendar.events.length >= 50}
                    onClick={() =>
                      onPatch("eventCalendar", {
                        ...config.eventCalendar,
                        events: [
                          ...config.eventCalendar.events,
                          {
                            id: crypto.randomUUID(),
                            name: "",
                            date: null,
                            location: "",
                            description: "",
                            rsvpEnabled: false,
                          },
                        ],
                      })
                    }
                  >
                    {t("Event hinzufügen", "Add event")}
                  </Button>
                </div>
                {config.eventCalendar.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("Noch keine Events. Fügen Sie den ersten Termin hinzu.", "No events yet. Add the first date.")}</p>
                ) : null}
                {config.eventCalendar.events.map((event, index) => (
                  <fieldset key={event.id} className="grid gap-4 rounded-lg border border-border p-4">
                    <legend className="px-1 text-sm font-medium">{t("Event", "Event")} {index + 1}</legend>
                    <TextField
                      id={`event-name-${event.id}`}
                      label={t("Name", "Name")}
                      value={event.name}
                      disabled={disabled}
                      onChange={(name) => {
                        const events = config.eventCalendar.events.map((item) =>
                          item.id === event.id ? { ...item, name } : item,
                        );
                        onPatch("eventCalendar", { ...config.eventCalendar, events });
                      }}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DateField
                        id={`event-date-${event.id}`}
                        label={t("Datum", "Date")}
                        value={event.date}
                        disabled={disabled}
                        onChange={(date) => {
                          const events = config.eventCalendar.events.map((item) =>
                            item.id === event.id ? { ...item, date } : item,
                          );
                          onPatch("eventCalendar", { ...config.eventCalendar, events });
                        }}
                      />
                      <TextField
                        id={`event-location-${event.id}`}
                        label={t("Ort", "Place")}
                        value={event.location}
                        disabled={disabled}
                        onChange={(location) => {
                          const events = config.eventCalendar.events.map((item) =>
                            item.id === event.id ? { ...item, location } : item,
                          );
                          onPatch("eventCalendar", { ...config.eventCalendar, events });
                        }}
                      />
                    </div>
                    <AreaField
                      id={`event-body-${event.id}`}
                      label={t("Beschreibung", "Description")}
                      value={event.description}
                      disabled={disabled}
                      onChange={(description) => {
                        const events = config.eventCalendar.events.map((item) =>
                          item.id === event.id ? { ...item, description } : item,
                        );
                        onPatch("eventCalendar", { ...config.eventCalendar, events });
                      }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor={`event-rsvp-${event.id}`}>{t("Teilnahme-Button", "Attendance button")}</Label>
                      <Switch
                        id={`event-rsvp-${event.id}`}
                        checked={event.rsvpEnabled}
                        disabled={disabled}
                        onCheckedChange={(rsvpEnabled) => {
                          const events = config.eventCalendar.events.map((item) =>
                            item.id === event.id ? { ...item, rsvpEnabled } : item,
                          );
                          onPatch("eventCalendar", { ...config.eventCalendar, events });
                        }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() =>
                          onPatch("eventCalendar", {
                            ...config.eventCalendar,
                            events: config.eventCalendar.events.filter((item) => item.id !== event.id),
                          })
                        }
                      >
                        {t("Event entfernen", "Remove event")}
                      </Button>
                    </div>
                  </fieldset>
                ))}
              </div>
            ) : null}
          </section>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={disabled}>
            {disabled ? t("Speichert…", "Saving…") : t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
