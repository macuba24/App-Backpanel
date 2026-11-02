"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaField, NumberField, SwitchRow, TextField } from "@/components/dashboard/fields";
import { moduleAnchor } from "@/components/dashboard/module-anchor";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey } from "@/modules/schema";

const category = categoryRegistry.find((item) => item.id === "geofence");

type CardProps = {
  config: ActiveModulesConfig;
  disabled: boolean;
  onPatch: <K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) => void;
  onSave: () => void;
};

export function GeofenceCard({ config, disabled, onPatch, onSave }: CardProps) {
  const t = useT();
  const fence = config.geofence;
  if (!category) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(category.title, "Geofencing")}</CardTitle>
        <CardDescription>
          {t(
            category.description,
            "A notice inside the shop radius. The position stays on the phone.",
          )}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <CardContent>
          <section
            {...moduleAnchor(
              "geofence",
              `grid gap-4 rounded-xl border-2 border-black p-4 ${fence.enabled ? "feature-integrated" : ""}`,
            )}
          >
            <SwitchRow
              id="geofence-enabled"
              label={t("Geofencing", "Geofencing")}
              description={t(
                "Ein: die geöffnete App prüft, ob das Handy im Umkreis ist. Aus: es wird nichts geprüft. Der Standort wird nicht gespeichert.",
                "On: the open app checks whether the phone is inside the radius. Off: nothing is checked. The position is not stored.",
              )}
              checked={fence.enabled}
              disabled={disabled}
              onCheckedChange={(enabled) => onPatch("geofence", { ...fence, enabled })}
            />
            {fence.enabled ? (
              <div className="grid gap-4">
                <TextField
                  id="geofence-title"
                  label={t("Titel", "Title")}
                  value={fence.title}
                  disabled={disabled}
                  onChange={(title) => onPatch("geofence", { ...fence, title })}
                />
                <AreaField
                  id="geofence-message"
                  label={t("Nachricht im Umkreis", "Message inside the radius")}
                  value={fence.message}
                  disabled={disabled}
                  onChange={(message) => onPatch("geofence", { ...fence, message })}
                />
                <NumberField
                  id="geofence-lat"
                  label={t("Breitengrad", "Latitude")}
                  value={fence.latitude}
                  min={-90}
                  max={90}
                  step={0.0000001}
                  disabled={disabled}
                  onChange={(latitude) => onPatch("geofence", { ...fence, latitude })}
                />
                <NumberField
                  id="geofence-lon"
                  label={t("Längengrad", "Longitude")}
                  value={fence.longitude}
                  min={-180}
                  max={180}
                  step={0.0000001}
                  disabled={disabled}
                  onChange={(longitude) => onPatch("geofence", { ...fence, longitude })}
                />
                <NumberField
                  id="geofence-radius"
                  label={t("Umkreis in Metern", "Radius in metres")}
                  value={fence.radiusMeters}
                  min={50}
                  max={2000}
                  step={10}
                  disabled={disabled}
                  hint={t("Voreingestellt: Löhrstraße 51, 150 Meter.", "Default: Löhrstraße 51, 150 metres.")}
                  onChange={(radiusMeters) => onPatch("geofence", { ...fence, radiusMeters })}
                />
              </div>
            ) : null}
          </section>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={disabled}>
            {t("Speichern", "Save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
