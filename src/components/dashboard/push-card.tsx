"use client";

import { useEffect, useState } from "react";

import { countPushDevices } from "@/actions/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DateTimeField } from "@/components/dashboard/datetime-field";
import { AreaField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { useLocale, useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey } from "@/modules/schema";

const category = categoryRegistry[3];

const pushFigures = [
  { label: "Osterhase", labelEn: "Easter bunny", mark: "🐰" },
  { label: "Osterei", labelEn: "Easter egg", mark: "🥚" },
  { label: "Weihnachtsmann", labelEn: "Santa", mark: "🎅" },
  { label: "Tannenbaum", labelEn: "Christmas tree", mark: "🎄" },
  { label: "Schneemann", labelEn: "Snowman", mark: "⛄" },
  { label: "Geschenk", labelEn: "Gift", mark: "🎁" },
  { label: "Herz", labelEn: "Heart", mark: "❤️" },
  { label: "Sekt", labelEn: "Sparkling wine", mark: "🥂" },
  { label: "Feuerwerk", labelEn: "Fireworks", mark: "🎆" },
  { label: "Kürbis", labelEn: "Pumpkin", mark: "🎃" },
] as const;

function withFigure(message: string, mark: string) {
  const trimmed = message.replace(/\s+$/, "");
  return trimmed.length === 0 ? mark : `${trimmed} ${mark}`;
}

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  sending: boolean;
  sendingNow: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
  onQueue: () => void;
  onSendNow: () => void;
};

function formatQueuedAt(value: string | null, lang: "de" | "en"): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PushCard({ config, disabled, sending, sendingNow, onPatch, onSave, onQueue, onSendNow }: CardProps) {
  const t = useT();
  const { lang } = useLocale();
  const queuedLabel = formatQueuedAt(config.pushCenter.lastQueuedAt, lang);
  const busy = disabled || sending || sendingNow;
  const [devices, setDevices] = useState<number | null>(null);

  useEffect(() => {
    void countPushDevices().then(setDevices);
  }, [config.pushCenter.lastQueuedAt]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Push and direct marketing")}</CardTitle>
        <CardDescription>{t(category.description, "Queued messages and time-limited offers.")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent className="grid gap-8">
          <section {...moduleAnchor("pushCenter", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.pushCenter.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="push-enabled"
              label={t("Mitteilungen auf dem Handy", "Notices on the phone")}
              description={t(
                "Ein: die Mitteilung kann auf dem Sperrbildschirm erscheinen, auch wenn die App zu ist. Aus: es wird nichts gesendet und der Hinweis in der App verschwindet. Das Handy muss die Mitteilung einmal erlauben.",
                "On: the notice can appear on the lock screen even when the app is closed. Off: nothing is sent and the prompt disappears from the app. The phone must allow the notice once.",
              )}
              checked={config.pushCenter.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => onPatch("pushCenter", { ...config.pushCenter, enabled })}
            />
            {config.pushCenter.enabled ? (
              <div className="grid gap-4">
                <TextField
                  id="push-title"
                  label={t("Titel", "Title")}
                  value={config.pushCenter.title}
                  disabled={busy}
                  onChange={(title) => onPatch("pushCenter", { ...config.pushCenter, title })}
                />
                <AreaField
                  id="push-message"
                  label={t("Nachrichtentext", "Message text")}
                  value={config.pushCenter.message}
                  disabled={busy}
                  onChange={(message) => onPatch("pushCenter", { ...config.pushCenter, message })}
                />
                <div className="grid gap-2">
                  <p className="text-sm font-medium">{t("Figur einfügen", "Insert a figure")}</p>
                  <div className="flex flex-wrap gap-2">
                    {pushFigures.map((figure) => (
                      <Button
                        key={figure.mark}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          onPatch("pushCenter", {
                            ...config.pushCenter,
                            message: withFigure(config.pushCenter.message, figure.mark),
                          })
                        }
                      >
                        {figure.mark} {t(figure.label, figure.labelEn)}
                      </Button>
                    ))}
                  </div>
                </div>
                <TextField
                  id="push-link"
                  label={t("Deep-Link", "Deep link")}
                  placeholder="/aktionen/winter"
                  value={config.pushCenter.deepLink}
                  disabled={busy}
                  onChange={(deepLink) => onPatch("pushCenter", { ...config.pushCenter, deepLink })}
                />
                <p className="text-sm text-muted-foreground">
                  {devices === null
                    ? t("Handys werden gezählt…", "Counting phones…")
                    : t(
                        devices === 1 ? "1 Handy darf Mitteilungen empfangen." : `${devices} Handys dürfen Mitteilungen empfangen.`,
                        devices === 1 ? "1 phone may receive notices." : `${devices} phones may receive notices.`,
                      )}
                </p>
                {queuedLabel ? (
                  <p className="text-sm text-muted-foreground">{t("Zuletzt eingereiht", "Last queued")}: {queuedLabel}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("Noch nicht eingereiht.", "Not queued yet.")}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={onQueue}>
                    {sending ? t("Wird eingereiht…", "Queuing…") : t("Nachricht senden", "Send message")}
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={onSendNow}>
                    {sendingNow ? t("Wird gesendet…", "Sending…") : t("Sofort", "Now")}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <Separator />

          <section {...moduleAnchor("flashDeal", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.flashDeal.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="flash-enabled"
              label={t("Flash-Deals", "Flash deals")}
              description={t("Kurzfristiges Angebot mit Aktionsstart und Countdown-Ende.", "A short-term offer with a start and a countdown end.")}
              checked={config.flashDeal.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => onPatch("flashDeal", { ...config.flashDeal, enabled })}
            />
            {config.flashDeal.enabled ? (
              <div className="grid gap-4">
                <TextField
                  id="flash-title"
                  label={t("Rabatt-Titel", "Discount title")}
                  value={config.flashDeal.title}
                  disabled={busy}
                  onChange={(title) => onPatch("flashDeal", { ...config.flashDeal, title })}
                />
                <TextField
                  id="flash-value"
                  label={t("Rabattwert", "Discount value")}
                  placeholder="25 %"
                  value={config.flashDeal.discountValue}
                  disabled={busy}
                  onChange={(discountValue) => onPatch("flashDeal", { ...config.flashDeal, discountValue })}
                />
                <DateTimeField
                  id="flash-start"
                  label={t("Aktionsstart", "Offer start")}
                  timeLabel={t("Startzeit", "Start time")}
                  value={config.flashDeal.startsAt}
                  disabled={busy}
                  onChange={(startsAt) => onPatch("flashDeal", { ...config.flashDeal, startsAt })}
                />
                <DateTimeField
                  id="flash-end"
                  label={t("Countdown-Ende", "Countdown end")}
                  timeLabel={t("Endzeit", "End time")}
                  value={config.flashDeal.countdownEnd}
                  disabled={busy}
                  onChange={(countdownEnd) => onPatch("flashDeal", { ...config.flashDeal, countdownEnd })}
                />
              </div>
            ) : null}
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
