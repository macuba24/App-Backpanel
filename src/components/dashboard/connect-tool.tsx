"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { toast } from "sonner";

import { saveAppConnection } from "@/actions/connection";
import { TextField } from "@/components/dashboard/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recognizeAppLink, type RejectReason, type SavedAppLink } from "@/lib/app-catalog";
import { useT } from "@/lib/locale";

const REJECTION: Record<RejectReason, [string, string]> = {
  empty: [
    "Bitte einen QR-Code wählen oder den Link zur App einfügen.",
    "Choose a QR code or paste the link to the app.",
  ],
  wifi: [
    "Dieser QR-Code ist ein WLAN-Zugang, keine App. Es wurde nichts verbunden.",
    "This QR code is a Wi-Fi login, not an app. Nothing was connected.",
  ],
  contact: [
    "Dieser QR-Code ist ein Kontakt, keine App. Es wurde nichts verbunden.",
    "This QR code is a contact, not an app. Nothing was connected.",
  ],
  payment: [
    "Dieser QR-Code ist eine Zahlung, keine App. Es wurde nichts verbunden.",
    "This QR code is a payment, not an app. Nothing was connected.",
  ],
  "not-link": [
    "Das ist kein Link zu einer App. Es wurde nichts verbunden.",
    "That is not a link to an app. Nothing was connected.",
  ],
  unknown: [
    "Diese Adresse gehört zu keiner bekannten App. Es wurde nichts verbunden.",
    "This address does not belong to a known app. Nothing was connected.",
  ],
};

async function decodeQrFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  bitmap.close();
  const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
  return code?.data ?? null;
}

export function ConnectTool({ connection }: { connection: SavedAppLink | null }) {
  const t = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [found, setFound] = useState<SavedAppLink | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function showDecision(raw: string) {
    const decision = recognizeAppLink(raw);
    if (!decision.ok) {
      setFound(null);
      const copy = REJECTION[decision.reason];
      setNotice(t(copy[0], copy[1]));
      return null;
    }
    setFound(decision.app);
    setNotice(
      t(
        `${decision.app.name} ist erkannt. „App verbinden“ speichert diese Verbindung.`,
        `${decision.app.name} was recognized. “Connect app” saves this connection.`,
      ),
    );
    return decision.app;
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      setFound(null);
      setNotice(t("Bitte ein Bild des QR-Codes wählen.", "Please choose an image of the QR code."));
      return;
    }
    setBusy(true);
    try {
      const text = await decodeQrFile(file);
      if (!text) {
        setFound(null);
        setLink("");
        setNotice(t("In diesem Bild ist kein QR-Code lesbar.", "No QR code can be read in this image."));
        return;
      }
      setLink(text);
      showDecision(text);
    } catch {
      setFound(null);
      setNotice(t("In diesem Bild ist kein QR-Code lesbar.", "No QR code can be read in this image."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function connect() {
    const decision = recognizeAppLink(link);
    if (!decision.ok) {
      setFound(null);
      const copy = REJECTION[decision.reason];
      setNotice(t(copy[0], copy[1]));
      return;
    }
    setFound(decision.app);
    setBusy(true);
    const result = await saveAppConnection(decision.app.url);
    setBusy(false);
    if (!result.ok) {
      setNotice(result.error);
      toast.error(result.error);
      return;
    }
    setNotice(t(`${result.app.name} ist verbunden.`, `${result.app.name} is connected.`));
    toast.success(t(`${result.app.name} ist verbunden.`, `${result.app.name} is connected.`));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("App verbinden", "Connect app")}</CardTitle>
        <CardDescription>
          {t(
            "QR-Code der App wählen oder den Link einfügen. Verbunden wird nur eine erkannte App.",
            "Choose the app QR code or paste the link. Only a recognized app is connected.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {connection ? (
          <p className="text-sm text-zinc-700">
            {t("Zurzeit verbunden:", "Currently connected:")}{" "}
            <a className="font-medium underline" href={connection.url} target="_blank" rel="noreferrer">
              {connection.name}
            </a>
          </p>
        ) : (
          <p className="text-sm text-zinc-600">{t("Noch keine App über dieses Tool verbunden.", "No app has been connected with this tool yet.")}</p>
        )}
        <TextField
          id="app-link"
          label={t("Link zur App", "Link to the app")}
          type="url"
          placeholder="https://"
          value={link}
          disabled={busy}
          onChange={(value) => {
            setLink(value);
            setFound(null);
            setNotice(null);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            {t("QR-Code auswählen", "Choose QR code")}
          </Button>
          <Button type="button" disabled={busy} onClick={() => void connect()}>
            {t("App verbinden", "Connect app")}
          </Button>
        </div>
        {found ? (
          <p className="text-sm font-medium text-zinc-900">
            {t("Erkannte App:", "Recognized app:")} {found.name}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-sm text-zinc-700">
            {notice}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
