"use client";

import { format, isValid, parse } from "date-fns";
import { de, enGB } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/locale";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateFieldProps = {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

function toDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DateField({ id, label, value, onChange, disabled }: DateFieldProps) {
  const selected = toDate(value);
  const { lang } = useLocale();
  const t = useT();
  const locale = lang === "en" ? enGB : de;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button id={id} type="button" variant="outline" data-field="date" disabled={disabled} className="w-44 justify-start font-normal">
              {selected ? format(selected, "dd.MM.yyyy", { locale }) : t("Datum wählen", "Choose date")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : null)}
              locale={locale}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
        {value ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(null)}>
            {t("Zurücksetzen", "Reset")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
