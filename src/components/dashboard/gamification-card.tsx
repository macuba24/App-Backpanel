"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NumberField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey } from "@/modules/schema";

const category = categoryRegistry[0];

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

export function GamificationCard({ config, disabled, onPatch, onSave }: CardProps) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Gamification and loyalty")}</CardTitle>
        <CardDescription>{t(category.description, "Loyalty through stamps, a wheel and visit challenges.")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent className="grid gap-8">
          <section {...moduleAnchor("stampCard", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.stampCard.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="stamp-enabled"
              label={t("Digitaler Stempelpass", "Digital stamp card")}
              description={t("Kunden sammeln Stempel bis zur Zielanzahl und lösen den Code ein.", "Customers collect stamps up to the target and redeem the code.")}
              checked={config.stampCard.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("stampCard", { ...config.stampCard, enabled })}
            />
            {config.stampCard.enabled ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="stamp-count"
                  label={t("Stempelanzahl", "Number of stamps")}
                  value={config.stampCard.stampCount}
                  min={1}
                  max={100}
                  disabled={disabled}
                  onChange={(stampCount) => onPatch("stampCard", { ...config.stampCard, stampCount })}
                />
                <TextField
                  id="stamp-code"
                  label={t("Einlöse-Code", "Redeem code")}
                  value={config.stampCard.redeemCode}
                  disabled={disabled}
                  onChange={(redeemCode) => onPatch("stampCard", { ...config.stampCard, redeemCode })}
                />
                <div className="sm:col-span-2">
                  <TextField
                    id="stamp-reward"
                    label={t("Belohnungstext", "Reward text")}
                    value={config.stampCard.rewardText}
                    disabled={disabled}
                    onChange={(rewardText) => onPatch("stampCard", { ...config.stampCard, rewardText })}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <Separator />

          <section {...moduleAnchor("wheel", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.wheel.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="wheel-enabled"
              label={t("Glücksrad / Tages-Chance", "Wheel / daily chance")}
              description={t("Eine Drehung innerhalb der Abklingzeit. Die Gewinnwahrscheinlichkeit gilt für die Drehung insgesamt.", "One spin within the cooldown. The win chance applies to the spin as a whole.")}
              checked={config.wheel.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("wheel", { ...config.wheel, enabled })}
            />
            {config.wheel.enabled ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="wheel-chance"
                    label={t("Gewinnwahrscheinlichkeit (%)", "Win probability (%)")}
                    hint={t("Chance, dass eine Drehung überhaupt gewinnt.", "Chance that a spin wins at all.")}
                    value={config.wheel.winProbabilityPercent}
                    min={0}
                    max={100}
                    step={1}
                    disabled={disabled}
                    onChange={(winProbabilityPercent) => onPatch("wheel", { ...config.wheel, winProbabilityPercent })}
                  />
                  <NumberField
                    id="wheel-cooldown"
                    label={t("Abklingzeit (Stunden)", "Cooldown (hours)")}
                    value={config.wheel.cooldownHours}
                    min={0}
                    max={8760}
                    disabled={disabled}
                    onChange={(cooldownHours) => onPatch("wheel", { ...config.wheel, cooldownHours })}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{t("Gewinngutscheine", "Prize vouchers")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled || config.wheel.prizes.length >= 20}
                      onClick={() =>
                        onPatch("wheel", {
                          ...config.wheel,
                          prizes: [...config.wheel.prizes, { label: "", probabilityPercent: 0 }],
                        })
                      }
                    >
                      {t("Gutschein hinzufügen", "Add voucher")}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("Die Einzelwerte beschreiben die Verteilung unter den Gewinnen und müssen nicht 100 ergeben.", "The individual values describe the split among wins and do not have to add up to 100.")}
                  </p>
                  {config.wheel.prizes.map((prize, index) => (
                    <div key={`prize-${index}`} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_140px_auto]">
                      <div className="grid gap-2">
                        <Label htmlFor={`prize-label-${index}`}>{t("Bezeichnung", "Name")}</Label>
                        <Input
                          id={`prize-label-${index}`}
                          value={prize.label}
                          disabled={disabled}
                          onChange={(event) => {
                            const prizes = config.wheel.prizes.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: event.target.value } : item,
                            );
                            onPatch("wheel", { ...config.wheel, prizes });
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`prize-prob-${index}`}>{t("Wahrscheinlichkeit %", "Probability %")}</Label>
                        <Input
                          id={`prize-prob-${index}`}
                          type="number"
                          min={0}
                          max={100}
                          value={prize.probabilityPercent}
                          disabled={disabled}
                          onChange={(event) => {
                            const next = event.target.valueAsNumber;
                            const prizes = config.wheel.prizes.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, probabilityPercent: Number.isFinite(next) ? next : 0 }
                                : item,
                            );
                            onPatch("wheel", { ...config.wheel, prizes });
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={disabled || config.wheel.prizes.length <= 1}
                          onClick={() =>
                            onPatch("wheel", {
                              ...config.wheel,
                              prizes: config.wheel.prizes.filter((_, itemIndex) => itemIndex !== index),
                            })
                          }
                        >
                          {t("Entfernen", "Remove")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <Separator />

          <section {...moduleAnchor("challengePass", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.challengePass.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="challenge-enabled"
              label={t("Challenge-Pass", "Challenge pass")}
              description={t("Belohnung, sobald die Zielanzahl der Besuche erreicht ist.", "A reward once the visit target is reached.")}
              checked={config.challengePass.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("challengePass", { ...config.challengePass, enabled })}
            />
            {config.challengePass.enabled ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="challenge-target"
                  label={t("Zielanzahl Besuche", "Target visits")}
                  value={config.challengePass.visitTarget}
                  min={1}
                  max={365}
                  disabled={disabled}
                  onChange={(visitTarget) => onPatch("challengePass", { ...config.challengePass, visitTarget })}
                />
                <TextField
                  id="challenge-reward"
                  label={t("Belohnung", "Reward")}
                  value={config.challengePass.rewardText}
                  disabled={disabled}
                  onChange={(rewardText) => onPatch("challengePass", { ...config.challengePass, rewardText })}
                />
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
