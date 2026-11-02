"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AreaField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey } from "@/modules/schema";

const category = categoryRegistry[1];

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

export function DialogCard({ config, disabled, onPatch, onSave }: CardProps) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Dialog and insights")}</CardTitle>
        <CardDescription>{t(category.description, "Feedback and short polls from the customer app.")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent className="grid gap-8">
          <section {...moduleAnchor("directFeedback", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.directFeedback.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="feedback-enabled"
              label={t("Direct Feedback", "Direct feedback")}
              description={t("Die Bewertung in der App ist fest auf 5 Sterne eingestellt.", "The rating in the app is fixed at 5 stars.")}
              checked={config.directFeedback.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("directFeedback", { ...config.directFeedback, enabled })}
            />
            {config.directFeedback.enabled ? (
              <div className="grid gap-4">
                <AreaField
                  id="feedback-question"
                  label={t("Fragetext", "Question")}
                  value={config.directFeedback.question}
                  disabled={disabled}
                  onChange={(question) => onPatch("directFeedback", { ...config.directFeedback, question })}
                />
                <p className="text-sm text-muted-foreground">
                  {t("1–3 Sterne lösen die Benachrichtigung aus. 5 Sterne öffnen die Google-Bewertung. Ein anderer Fragetyp wird nicht angeboten.", "1–3 stars trigger the notification. 5 stars open the Google review. No other question type is offered.")}
                </p>
                <TextField
                  id="feedback-email"
                  label={t("Benachrichtigungs-E-Mail bei schlechter Bewertung (1–3)", "Notification email for a low rating (1–3)")}
                  type="email"
                  value={config.directFeedback.notifyEmail}
                  disabled={disabled}
                  onChange={(notifyEmail) => onPatch("directFeedback", { ...config.directFeedback, notifyEmail })}
                />
                <TextField
                  id="feedback-google"
                  label={t("Google-Bewertungs-URL bei 5 Sternen", "Google review URL at 5 stars")}
                  type="url"
                  placeholder="https://"
                  value={config.directFeedback.googleReviewUrl}
                  disabled={disabled}
                  onChange={(googleReviewUrl) => onPatch("directFeedback", { ...config.directFeedback, googleReviewUrl })}
                />
              </div>
            ) : null}
          </section>

          <Separator />

          <section {...moduleAnchor("quickPoll", `grid gap-4 rounded-xl border-2 border-black p-4 ${config.quickPoll.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="poll-enabled"
              label={t("Quick-Polls", "Quick polls")}
              description={t("Eine Frage mit mindestens zwei Antwortoptionen.", "One question with at least two answers.")}
              checked={config.quickPoll.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("quickPoll", { ...config.quickPoll, enabled })}
            />
            {config.quickPoll.enabled ? (
              <div className="grid gap-4">
                <AreaField
                  id="poll-question"
                  label={t("Umfragefrage", "Poll question")}
                  value={config.quickPoll.question}
                  disabled={disabled}
                  onChange={(question) => onPatch("quickPoll", { ...config.quickPoll, question })}
                />
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{t("Antwortoptionen", "Answer options")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled || config.quickPoll.options.length >= 12}
                      onClick={() =>
                        onPatch("quickPoll", {
                          ...config.quickPoll,
                          options: [...config.quickPoll.options, ""],
                        })
                      }
                    >
                      {t("Option hinzufügen", "Add option")}
                    </Button>
                  </div>
                  {config.quickPoll.options.map((option, index) => (
                    <div key={`option-${index}`} className="flex items-end gap-2">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor={`poll-option-${index}`}>{t("Option", "Option")} {index + 1}</Label>
                        <Input
                          id={`poll-option-${index}`}
                          value={option}
                          disabled={disabled}
                          onChange={(event) => {
                            const options = config.quickPoll.options.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            );
                            onPatch("quickPoll", { ...config.quickPoll, options });
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled || config.quickPoll.options.length <= 2}
                        onClick={() =>
                          onPatch("quickPoll", {
                            ...config.quickPoll,
                            options: config.quickPoll.options.filter((_, itemIndex) => itemIndex !== index),
                          })
                        }
                      >
                        {t("Entfernen", "Remove")}
                      </Button>
                    </div>
                  ))}
                </div>
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
