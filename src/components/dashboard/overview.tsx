"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Gauge, Globe, Hash, ListOrdered, MapPin, MessageSquare, QrCode, ScanLine, UserRound, Cake } from "lucide-react";
import { toast } from "sonner";

import { saveWebsiteUrl } from "@/actions/factory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/dashboard/fields";
import { SchmahlMirror } from "@/components/dashboard/schmahl-mirror";
import { SecretValue } from "@/components/dashboard/secret-value";
import { useT } from "@/lib/locale";
import { activeAppLink, type SavedAppLink } from "@/lib/app-catalog";
import type { PanelTenant } from "@/lib/panel-context";
import type { FactoryKey } from "@/modules/factory";

const APP_STATUS: { key: FactoryKey; de: string; en: string; icon: typeof Gauge }[] = [
  { key: "bonusBar", de: "Bonusbalken", en: "Bonus bar", icon: Gauge },
  { key: "tiers", de: "Bonusstufen", en: "Bonus tiers", icon: ListOrdered },
  { key: "name", de: "Name", en: "Name", icon: UserRound },
  { key: "address", de: "Adresse", en: "Address", icon: MapPin },
  { key: "birthday", de: "Geburtstag", en: "Birthday", icon: Cake },
  { key: "customerNumber", de: "Kundennummer", en: "Customer number", icon: Hash },
  { key: "customerCode", de: "Kunden-Code", en: "Customer code", icon: QrCode },
  { key: "receipt", de: "Rechnungsscanner", en: "Receipt scanner", icon: ScanLine },
  { key: "feedback", de: "Kundenfeedback", en: "Customer feedback", icon: MessageSquare },
  { key: "company", de: "Firmenadresse", en: "Company address", icon: Building2 },
  { key: "homepage", de: "Homepage", en: "Homepage", icon: Globe },
];

export function LinkedAppSummary({ connection }: { connection: SavedAppLink | null }) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Verbundene App", "Connected app")}</CardTitle>
        <CardDescription>
          {connection
            ? t("Diese App ist mit dem Panel verbunden.", "This app is connected to the panel.")
            : t("Noch keine App verbunden. QR-Code oder Link unter App verbinden einfügen.", "No app connected yet. Add a QR code or a link under Connect app.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {connection ? (
          <>
            <p className="text-lg font-semibold tracking-tight">{connection.name}</p>
            <a className="truncate text-sm font-medium underline" href={connection.url} target="_blank" rel="noreferrer">
              {connection.url}
            </a>
          </>
        ) : (
          <Button asChild>
            <Link href="/dashboard/connect">{t("App verbinden", "Connect app")}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function Overview({ tenant, preview = tenant }: { tenant: PanelTenant; preview?: PanelTenant }) {
  const t = useT();
  const enabledCount = APP_STATUS.filter((item) => preview.factory[item.key].enabled).length;
  const linked = activeAppLink(tenant.slug, tenant.connection);

  return (
    <div className="grid gap-6">
      <WebsiteUrlCard publicUrl={preview.connection?.url || preview.factory.homepage.url} />
      <Card>
        <CardHeader>
          <CardTitle>{t("Werkseinstellung", "Factory settings")}</CardTitle>
          <CardDescription>
            {t(
              "Ausgangssituation der App. Bonusbalken, Bonusstufen, Name, Adresse, Geburtstag, Kundennummer, Kunden-Code, Rechnungsscanner, Feedback, Firmenadresse und Homepage können Sie ändern oder wegnehmen.",
              "The delivered setup of the app. You can change or remove the bonus bar, bonus tiers, name, address, birthday, customer number, customer code, receipt scanner, feedback, company address and homepage.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/factory">{t("Werkseinstellung öffnen", "Open factory settings")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Originalansicht", "Original view")}</CardTitle>
          <CardDescription>
            {linked
              ? t("Die Kunden-App liest dieselben Module live.", "The customer app reads the same modules live.")
              : t("Für diesen Zugang ist keine Kunden-App gekoppelt.", "No customer app is linked to this account.")}{" "}
            {linked ? (
              <a className="underline" href={linked.url} target="_blank" rel="noreferrer">
                {t(`${linked.name} öffnen`, `Open ${linked.name}`)}
              </a>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchmahlMirror tenant={preview} canReorder={preview.id === tenant.id} />
        </CardContent>
      </Card>

      <section className="rounded-xl border-2 border-black bg-white px-5 py-4">
        <p className="text-sm text-zinc-500">{t("Gekoppelte App", "Linked app")}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{preview.connection?.name || preview.appName}</p>
        <p className="mt-1 font-mono text-sm text-zinc-600">{preview.slug}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Slug</CardDescription>
            <CardTitle className="text-lg font-medium">{preview.slug}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("Aktive Merkmale", "Active features")}</CardDescription>
            <CardTitle className="text-lg font-medium">
              {enabledCount} {t("von", "of")} {APP_STATUS.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("Primärfarbe", "Primary colour")}</CardDescription>
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <span
                className="inline-block size-6 rounded-md border border-black/10"
                style={{ backgroundColor: preview.branding.primaryColor }}
                aria-hidden
              />
              <span>{preview.branding.primaryColor}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("API-Schlüssel", "API key")}</CardTitle>
          <CardDescription>
            {t(
              `Öffentliche Lese-URL: /api/v1/app-config/${tenant.slug}. Ohne Schlüssel ist die Konfiguration lesbar. Ein falscher Schlüssel wird abgelehnt.`,
              `Public read URL: /api/v1/app-config/${tenant.slug}. Without a key the configuration can be read. A wrong key is rejected.`,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecretValue value={tenant.apiKey} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Modulstatus", "Module status")}</CardTitle>
          <CardDescription>
            {t(
              `Stand der gekoppelten App ${preview.connection?.name || preview.appName}. Ein Schalter in der Werkseinstellung ändert den Status.`,
              `Status of the linked app ${preview.connection?.name || preview.appName}. A switch in the factory settings changes the status.`,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {APP_STATUS.map((item) => {
              const enabled = preview.factory[item.key].enabled;
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Badge
                    variant={enabled ? "default" : "secondary"}
                    className={enabled ? "feature-integrated gap-1.5 px-2.5 py-1" : "gap-1.5 px-2.5 py-1"}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {t(item.de, item.en)}
                    <span className="sr-only">{enabled ? t("aktiv", "active") : t("inaktiv", "inactive")}</span>
                    <span aria-hidden>{enabled ? t("Aktiv", "Active") : t("Inaktiv", "Inactive")}</span>
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function WebsiteUrlCard({ publicUrl }: { publicUrl: string }) {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState(publicUrl);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setUrl(publicUrl);
  }, [publicUrl]);

  async function save() {
    setPending(true);
    const result = await saveWebsiteUrl(url);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if ("factory" in result && result.factory.homepage.url) setUrl(result.factory.homepage.url);
    toast.success(t("URL gespeichert.", "URL saved."));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("URL der Webseite", "Website URL")}</CardTitle>
        <CardDescription>
          {t(
            "Diese Adresse erscheint in der Kunden-App. Wenn sich die Webseite ändert, tragen Sie die neue URL hier ein.",
            "This address appears in the customer app. When the website changes, enter the new URL here.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {publicUrl ? (
          <a className="truncate text-sm font-medium underline" href={publicUrl} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        ) : (
          <p className="text-sm text-zinc-500">{t("Noch keine URL hinterlegt.", "No URL stored yet.")}</p>
        )}
        <TextField
          id="overview-website-url"
          label={t("URL der Webseite", "Website URL")}
          type="url"
          placeholder="https://"
          value={url}
          disabled={pending}
          onChange={setUrl}
        />
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button type="button" disabled={pending} onClick={() => void save()}>
          {pending ? t("Speichert…", "Saving…") : t("Speichern", "Save")}
        </Button>
      </CardFooter>
    </Card>
  );
}
