"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadPhoto } from "@/actions/photos";
import { DateField } from "@/components/dashboard/date-field";
import { DateTimeField } from "@/components/dashboard/datetime-field";
import { AreaField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey, PeriodOfferConfig, PeriodOffersConfig, WeeklyOfferConfig } from "@/modules/schema";
import { isWeeklyOfferActive, weeklyOfferWindowError } from "@/modules/weekly-offer";

const category = categoryRegistry.find((item) => item.id === "offers");

const periods = [
  { key: "day", de: "Angebot des Tages", en: "Offer of the day" },
  { key: "week", de: "Angebot der Woche", en: "Offer of the week" },
  { key: "month", de: "Angebot des Monats", en: "Offer of the month" },
] as const satisfies readonly { key: keyof Pick<PeriodOffersConfig, "day" | "week" | "month">; de: string; en: string }[];

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

export function OffersCard({ config, disabled, onPatch, onSave }: CardProps) {
  const t = useT();
  const offers = config.periodOffers;
  const offersRef = useRef(offers);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    offersRef.current = offers;
  }, [offers]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const busy = disabled || uploadingSlot !== null;

  function patchOffer(key: "day" | "month", patch: Partial<PeriodOfferConfig>) {
    const current = offersRef.current;
    onPatch("periodOffers", { ...current, [key]: { ...current[key], ...patch } });
  }

  function patchWeek(patch: Partial<WeeklyOfferConfig>) {
    const current = offersRef.current;
    onPatch("periodOffers", { ...current, week: { ...current.week, ...patch } });
  }

  function patchPhoto(index: number, patch: Partial<PeriodOffersConfig["photos"][number]>) {
    const current = offersRef.current;
    onPatch("periodOffers", {
      ...current,
      photos: current.photos.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    });
  }

  async function onFile(index: number, file: File | undefined) {
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    setUploadingSlot(index);
    const result = await uploadPhoto(body);
    setUploadingSlot(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    patchPhoto(index, { url: result.url });
    toast.success(t("Foto eingefügt. Bitte speichern, damit die App es übernimmt.", "Photo added. Save so the app picks it up."));
  }

  function clearPhoto(index: number) {
    patchPhoto(index, { url: "" });
  }

  if (!category) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Offer of the day, the week and the month")}</CardTitle>
        <CardDescription>
          {t(
            category.description,
            "Day, week and month offers with five photo slots. The weekly offer runs from the start time until before the end time.",
          )}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const windowError = weeklyOfferWindowError(offersRef.current.week);
          if (windowError) {
            toast.error(windowError);
            return;
          }
          onSave();
        }}
      >
        <CardContent>
          <section className={`grid gap-4 rounded-xl border-2 border-black p-4 ${offers.enabled ? "feature-integrated" : ""}`}>
            <SwitchRow
              id="period-offers-enabled"
              label={t("Angebot des Tages, der Woche und des Monats", "Offer of the day, the week and the month")}
              description={t(
                "Drei Angebote und fünf Fotoplätze. Das Angebot der Woche erscheint nur vom Startzeitpunkt bis vor dem Zielzeitpunkt.",
                "Three offers and five photo slots. The offer of the week appears only from the start time until before the end time.",
              )}
              checked={offers.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => onPatch("periodOffers", { ...offersRef.current, enabled })}
            />
            {!offers.enabled ? (
              <p className="text-sm text-muted-foreground">
                {t(
                  "Ausgeschaltet. Die drei Angebote und die fünf Fotoplätze bleiben gespeichert, erscheinen aber nicht in der App.",
                  "Switched off. The three offers and the five photo slots stay saved, but they do not appear in the app.",
                )}
              </p>
            ) : null}
            <div className="grid gap-4">
                {periods.map((period) => {
                  if (period.key === "week") {
                    const offer = offers.week;
                    const rangeError = offer.startsAt && offer.endsAt ? weeklyOfferWindowError(offer) : null;
                    return (
                      <fieldset key={period.key} className="grid gap-4 rounded-lg border border-border p-4">
                        <legend className="px-1 text-sm font-medium">{t(period.de, period.en)}</legend>
                        <TextField
                          id="period-week-title"
                          label={t("Titel", "Title")}
                          value={offer.title}
                          disabled={busy}
                          onChange={(title) => patchWeek({ title })}
                        />
                        <AreaField
                          id="period-week-description"
                          label={t("Beschreibung", "Description")}
                          value={offer.description}
                          disabled={busy}
                          onChange={(description) => patchWeek({ description })}
                        />
                        <TextField
                          id="period-week-price"
                          label={t("Preis", "Price")}
                          placeholder="12,99 €"
                          value={offer.price}
                          disabled={busy}
                          onChange={(price) => patchWeek({ price })}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <DateTimeField
                            id="period-week-start"
                            label={t("Startzeitpunkt", "Start time")}
                            timeLabel={t("Uhrzeit am Startzeitpunkt", "Time at the start")}
                            value={offer.startsAt}
                            disabled={busy}
                            onChange={(startsAt) => patchWeek({ startsAt })}
                          />
                          <DateTimeField
                            id="period-week-end"
                            label={t("Zielzeitpunkt", "End time")}
                            timeLabel={t("Uhrzeit am Zielzeitpunkt", "Time at the end")}
                            value={offer.endsAt}
                            disabled={busy}
                            onChange={(endsAt) => patchWeek({ endsAt })}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {!offer.startsAt || !offer.endsAt
                            ? t(
                                "Startzeitpunkt und Zielzeitpunkt sind erforderlich. Der Zielzeitpunkt muss danach liegen.",
                                "Start and end time are required. The end time must be later.",
                              )
                            : rangeError
                              ? t(
                                  "Der Zielzeitpunkt muss nach dem Startzeitpunkt liegen.",
                                  "The end time must be after the start time.",
                                )
                              : isWeeklyOfferActive(offer)
                                ? t(
                                    "Jetzt sichtbar. Das Angebot gilt ab dem Startzeitpunkt und endet vor dem Zielzeitpunkt.",
                                    "Visible now. The offer runs from the start time and ends before the end time.",
                                  )
                                : t(
                                    "Derzeit außerhalb des Zeitfensters. Sichtbar ab dem Startzeitpunkt bis vor dem Zielzeitpunkt.",
                                    "Currently outside the time window. Visible from the start time until before the end time.",
                                  )}
                        </p>
                      </fieldset>
                    );
                  }

                  const offer = offers[period.key];
                  return (
                    <fieldset key={period.key} className="grid gap-4 rounded-lg border border-border p-4">
                      <legend className="px-1 text-sm font-medium">{t(period.de, period.en)}</legend>
                      <TextField
                        id={`period-${period.key}-title`}
                        label={t("Titel", "Title")}
                        value={offer.title}
                        disabled={busy}
                        onChange={(title) => patchOffer(period.key, { title })}
                      />
                      <AreaField
                        id={`period-${period.key}-description`}
                        label={t("Beschreibung", "Description")}
                        value={offer.description}
                        disabled={busy}
                        onChange={(description) => patchOffer(period.key, { description })}
                      />
                      <TextField
                        id={`period-${period.key}-price`}
                        label={t("Preis", "Price")}
                        placeholder="12,99 €"
                        value={offer.price}
                        disabled={busy}
                        onChange={(price) => patchOffer(period.key, { price })}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DateField
                          id={`period-${period.key}-from`}
                          label={t("Startdatum", "Start date")}
                          value={offer.validFrom}
                          disabled={busy}
                          onChange={(validFrom) => patchOffer(period.key, { validFrom })}
                        />
                        <DateField
                          id={`period-${period.key}-until`}
                          label={t("Enddatum", "End date")}
                          value={offer.validUntil}
                          disabled={busy}
                          onChange={(validUntil) => patchOffer(period.key, { validUntil })}
                        />
                      </div>
                    </fieldset>
                  );
                })}
                <div className="grid gap-3">
                  <p className="text-sm font-medium">{t("Fotos", "Photos")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Fünf eigene Fotoplätze. Jeder Platz hat einen eigenen Upload.",
                      "Five separate photo slots. Each slot has its own upload.",
                    )}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {offers.photos.map((photo, index) => (
                      <figure key={index} className="grid gap-2">
                        <figcaption className="text-sm font-medium">
                          {t("Foto", "Photo")} {index + 1}
                        </figcaption>
                        {photo.url ? (
                          // Merchant photos are stored on this panel and only previewed here.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.url}
                            alt={`${t("Foto", "Photo")} ${index + 1}`}
                            className="aspect-square w-full rounded-lg border-2 border-black object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-black/40 px-2 text-center text-sm text-zinc-500">
                            {t("Noch kein Foto.", "No photo yet.")}
                          </div>
                        )}
                        <TextField
                          id={`period-photo-price-${index}`}
                          label={t("Preis", "Price")}
                          placeholder="0,00 €"
                          value={photo.price}
                          disabled={busy}
                          onChange={(price) => patchPhoto(index, { price })}
                        />
                        <input
                          ref={(node) => {
                            inputRefs.current[index] = node;
                          }}
                          id={`period-photo-file-${index}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          aria-label={t(`Foto ${index + 1} hochladen`, `Upload photo ${index + 1}`)}
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            void onFile(index, file);
                          }}
                        />
                        <Button
                          id={`period-photo-upload-${index}`}
                          type="button"
                          disabled={busy}
                          onClick={() => inputRefs.current[index]?.click()}
                        >
                          {uploadingSlot === index
                            ? t("Lädt…", "Uploading…")
                            : photo.url
                              ? t("Ersetzen", "Replace")
                              : t("Foto hochladen", "Upload photo")}
                        </Button>
                        {photo.url ? (
                          <Button type="button" variant="outline" disabled={busy} onClick={() => clearPhoto(index)}>
                            {t("Entfernen", "Remove")}
                          </Button>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                </div>
            </div>
          </section>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={busy}>
            {disabled ? t("Speichert…", "Saving…") : t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
