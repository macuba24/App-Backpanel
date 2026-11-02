"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveDesign } from "@/actions/design";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AreaField, TextField } from "@/components/dashboard/fields";
import { useT } from "@/lib/locale";

type DesignFormProps = {
  tenantId: string;
  tenantName: string;
  primaryColor: string;
  logoUrl: string;
  welcomeMessage: string;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function DesignForm({ tenantId, tenantName, primaryColor, logoUrl, welcomeMessage }: DesignFormProps) {
  const router = useRouter();
  const t = useT();
  const [color, setColor] = useState(primaryColor);
  const [logo, setLogo] = useState(logoUrl);
  const [welcome, setWelcome] = useState(welcomeMessage);
  const [pending, setPending] = useState(false);
  const swatch = HEX.test(color) ? color : "#0f766e";

  async function onSubmit() {
    setPending(true);
    const result = await saveDesign(tenantId, {
      primaryColor: color,
      logoUrl: logo,
      welcomeMessage: welcome,
    });
    setPending(false);
    if (result.ok) {
      toast.success(t("Design gespeichert.", "Design saved."));
      router.refresh();
      return;
    }
    toast.error(result.error);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>controlpanel design</CardTitle>
          <CardDescription>{t("Farbe, Logo und Willkommensnachricht der Kunden-App.", "Colour, logo and welcome message of the customer app.")}</CardDescription>
        </CardHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="primary-color">{t("Primärfarbe", "Primary colour")}</Label>
              <div className="flex items-center gap-3">
                <input
                  id="primary-color-picker"
                  type="color"
                  aria-label={t("Farbwähler", "Colour picker")}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent"
                  value={swatch}
                  disabled={pending}
                  onChange={(event) => setColor(event.target.value)}
                />
                <Input
                  id="primary-color"
                  value={color}
                  spellCheck={false}
                  disabled={pending}
                  onChange={(event) => setColor(event.target.value)}
                  className="max-w-40 font-mono"
                />
              </div>
            </div>
            <TextField
              id="logo-url"
              label={t("Logo-URL", "Logo URL")}
              type="url"
              placeholder="https://"
              value={logo}
              disabled={pending}
              onChange={setLogo}
            />
            <AreaField
              id="welcome-message"
              label={t("Willkommensnachricht", "Welcome message")}
              value={welcome}
              disabled={pending}
              onChange={setWelcome}
            />
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={pending}>
              {pending ? t("Speichert…", "Saving…") : t("Speichern", "Save")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("Vorschau", "Preview")}</CardTitle>
          <CardDescription>{tenantName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: swatch }}>
            <div className="px-5 py-5 text-white" style={{ backgroundColor: swatch }}>
              {logo ? (
                // Merchant logos are arbitrary remote URLs and are only previewed here.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="mb-3 h-8 max-w-full object-contain" />
              ) : null}
              <p className="text-sm font-medium">{tenantName}</p>
            </div>
            <p className="px-5 py-5 text-sm leading-6 text-zinc-700">
              {welcome.trim() ? welcome : t("Die Willkommensnachricht erscheint hier.", "The welcome message appears here.")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
