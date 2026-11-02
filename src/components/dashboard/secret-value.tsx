"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/locale";

export function SecretValue({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const t = useT();
  const masked = value.length <= 8 ? "••••••••" : `${value.slice(0, 4)}••••${value.slice(-4)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded bg-muted px-2 py-1 text-sm">{visible ? value : masked}</code>
      <Button type="button" variant="outline" size="sm" onClick={() => setVisible((current) => !current)}>
        {visible ? t("Verbergen", "Hide") : t("Anzeigen", "Show")}
      </Button>
    </div>
  );
}
