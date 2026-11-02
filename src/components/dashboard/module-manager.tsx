"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { queuePushMessage, saveActiveModules, sendPushImmediately } from "@/actions/modules";
import { DialogCard } from "@/components/dashboard/dialog-card";
import { GeofenceCard } from "@/components/dashboard/geofence-card";
import { GamificationCard } from "@/components/dashboard/gamification-card";
import { MarketingCard } from "@/components/dashboard/marketing-card";
import { moduleAnchor, modulePageCategoryIds } from "@/components/dashboard/module-anchor";
import { ModuleIndex } from "@/components/dashboard/module-index";
import { OffersCard } from "@/components/dashboard/offers-card";
import { OrderSlipCard } from "@/components/dashboard/order-slip-card";
import { PhotosCard } from "@/components/dashboard/photos-card";
import { PushCard } from "@/components/dashboard/push-card";
import { useT } from "@/lib/locale";
import { categoryRegistry } from "@/modules/registry";
import type { ActiveModulesConfig, ModuleKey } from "@/modules/schema";

type ModuleManagerProps = {
  tenantId: string;
  initialConfig: ActiveModulesConfig;
};

function pickModules(config: ActiveModulesConfig, keys: readonly ModuleKey[]): Partial<ActiveModulesConfig> {
  const patch: Partial<ActiveModulesConfig> = {};
  for (const key of keys) {
    writeModule(patch, key, config[key]);
  }
  return patch;
}

function writeModule<K extends ModuleKey>(
  target: Partial<ActiveModulesConfig>,
  key: K,
  value: ActiveModulesConfig[K],
) {
  target[key] = value;
}

export function ModuleManager({ tenantId, initialConfig }: ModuleManagerProps) {
  const router = useRouter();
  const t = useT();
  const [config, setConfig] = useState(initialConfig);
  const [pending, setPending] = useState<string | null>(null);

  function onPatch<K extends ModuleKey>(key: K, value: ActiveModulesConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  async function saveCategory(categoryId: string, keys: readonly ModuleKey[]) {
    setPending(categoryId);
    const result = await saveActiveModules(tenantId, pickModules(config, keys));
    setPending(null);
    if (result.ok) {
      toast.success(t("Änderungen gespeichert.", "Changes saved."));
      router.refresh();
      return;
    }
    toast.error(result.error);
  }

  async function queuePush() {
    setPending("push-send");
    const result = await queuePushMessage(tenantId, config.pushCenter);
    setPending(null);
    if (result.ok) {
      setConfig((current) => ({
        ...current,
        pushCenter: { ...current.pushCenter, lastQueuedAt: result.lastQueuedAt },
      }));
      toast.success(
        result.sent > 0
          ? t(
              result.sent === 1 ? "An 1 Handy gesendet." : `An ${result.sent} Handys gesendet.`,
              result.sent === 1 ? "Sent to 1 phone." : `Sent to ${result.sent} phones.`,
            )
          : t(
              "Gespeichert. Noch kein Handy hat Mitteilungen erlaubt.",
              "Saved. No phone has allowed notifications yet.",
            ),
      );
      router.refresh();
      return;
    }
    toast.error(result.error);
  }

  async function sendNow() {
    setPending("push-now");
    const result = await sendPushImmediately(tenantId, config.pushCenter);
    setPending(null);
    if (result.ok) {
      setConfig((current) => ({
        ...current,
        pushCenter: { ...current.pushCenter, lastQueuedAt: result.lastQueuedAt },
      }));
      toast.success(result.notice);
      router.refresh();
      return;
    }
    toast.error(result.error);
  }

  const listRef = useRef<HTMLDivElement>(null);

  function renderCategory(id: (typeof modulePageCategoryIds)[number]) {
    const category = categoryRegistry.find((item) => item.id === id);
    if (!category) return null;
    const shared = {
      config,
      disabled: pending === category.id,
      onPatch,
      onSave: () => void saveCategory(category.id, category.keys),
    };

    switch (id) {
      case "gamification":
        return <GamificationCard key={id} {...shared} />;
      case "dialog":
        return <DialogCard key={id} {...shared} />;
      case "marketing":
        return <MarketingCard key={id} {...shared} />;
      case "geofence":
        return <GeofenceCard key={id} {...shared} />;
      case "order":
        return <OrderSlipCard key={id} {...shared} />;
      case "photos":
        return <PhotosCard key={id} {...shared} />;
      case "offers": {
        const key = category.keys[0];
        if (!key) return null;
        return (
          <div key={id} {...moduleAnchor(key, "min-w-0")}>
            <OffersCard {...shared} />
          </div>
        );
      }
      case "push":
        return (
          <PushCard
            key={id}
            {...shared}
            sending={pending === "push-send"}
            sendingNow={pending === "push-now"}
            onQueue={() => void queuePush()}
            onSendNow={() => void sendNow()}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="xl:grid xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-start xl:gap-6">
      <ModuleIndex listRef={listRef} />
      <div ref={listRef} className="mt-4 grid min-w-0 gap-8 xl:mt-0">
        {modulePageCategoryIds.map((id) => renderCategory(id))}
      </div>
    </div>
  );
}
