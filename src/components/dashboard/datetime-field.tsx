"use client";

import { format, isValid } from "date-fns";
import { de, enGB } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/locale";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateTimeFieldProps = {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  timeLabel?: string;
};

function splitValue(value: string | null): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: "18:00" };
  const parsed = new Date(value);
  if (!isValid(parsed)) return { date: undefined, time: "18:00" };
  const time = `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  return { date: parsed, time };
}

function combine(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next.toISOString();
}

export function DateTimeField({ id, label, value, onChange, disabled, timeLabel }: DateTimeFieldProps) {
  const { date, time } = splitValue(value);
  const { lang } = useLocale();
  const t = useT();
  const locale = lang === "en" ? enGB : de;
  const clockLabel = timeLabel ?? t("Uhrzeit", "Time");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button id={id} type="button" variant="outline" data-field="date" disabled={disabled} className="w-44 justify-start font-normal">
              {date ? format(date, "dd.MM.yyyy", { locale }) : t("Datum wählen", "Choose date")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selected) => {
                if (!selected) {
                  onChange(null);
                  return;
                }
                onChange(combine(selected, time));
              }}
              locale={locale}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
        <Input
          id={`${id}-time`}
          type="time"
          aria-label={clockLabel}
          className="w-32"
          value={time}
          disabled={disabled || !date}
          onChange={(event) => {
            if (!date) return;
            onChange(combine(date, event.target.value || "00:00"));
          }}
        />
        {value ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(null)}>
            {t("Zurücksetzen", "Reset")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
