"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { uploadPhoto } from "@/actions/photos";
import { SwitchRow } from "@/components/dashboard/fields";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey } from "@/modules/schema";

const category = categoryRegistry.find((item) => item.id === "photos");

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

export function PhotosCard({ config, disabled, onPatch, onSave }: CardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const [uploading, setUploading] = useState(false);
  const photos = config.photos;
  const full = photos.items.length >= 3;

  async function onFile(file: File | undefined) {
    if (!file || full) return;
    const body = new FormData();
    body.set("file", file);
    setUploading(true);
    const result = await uploadPhoto(body);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onPatch("photos", {
      ...photos,
      items: [...photos.items, { id: crypto.randomUUID(), url: result.url }],
    });
    toast.success(t("Foto eingefügt. Bitte speichern, damit die App es übernimmt.", "Photo added. Save so the app picks it up."));
  }

  function remove(id: string) {
    onPatch("photos", {
      ...photos,
      items: photos.items.filter((item) => item.id !== id),
    });
  }

  if (!category) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Photos")}</CardTitle>
        <CardDescription>{t(category.description, "Up to three photos shown in the customer app.")}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent>
          <section {...moduleAnchor("photos", `grid gap-4 rounded-xl border-2 border-black p-4 ${photos.enabled ? "feature-integrated" : ""}`)}>
            <SwitchRow
              id="photos-enabled"
              label={t("Fotos", "Photos")}
              description={t("Höchstens drei Fotos. Sie erscheinen in der gekoppelten App.", "At most three photos. They appear in the linked app.")}
              checked={photos.enabled}
              disabled={disabled || uploading}
              onCheckedChange={(enabled) => onPatch("photos", { ...photos, enabled })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void onFile(file);
                }}
              />
              <Button
                type="button"
                disabled={disabled || uploading || full}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? t("Lädt…", "Uploading…") : t("Foto einfügen", "Add photo")}
              </Button>
              <p className="text-sm text-zinc-600">{photos.items.length} {t("von", "of")} 3</p>
            </div>
            {photos.items.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {photos.items.map((item, index) => (
                  <figure key={item.id} className="grid gap-2">
                    {/* Merchant photos are stored on this panel and only previewed here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Foto ${index + 1}`}
                      className="aspect-square w-full rounded-lg border-2 border-black object-cover"
                    />
                    <Button type="button" variant="outline" disabled={disabled || uploading} onClick={() => remove(item.id)}>
                      {t("Entfernen", "Remove")}
                    </Button>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">{t("Noch kein Foto eingefügt.", "No photo added yet.")}</p>
            )}
          </section>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={disabled || uploading}>
            {disabled ? t("Speichert…", "Saving…") : t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
