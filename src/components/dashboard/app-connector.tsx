"use client";

import { useEffect, useState } from "react";

import { useT } from "@/lib/locale";
import { activeAppLink, type SavedAppLink } from "@/lib/app-catalog";

type LinkState = "checking" | "up" | "down";

function stateLabel(state: LinkState, t: (de: string, en: string) => string) {
  if (state === "up") return t("erreichbar", "reachable");
  if (state === "down") return t("nicht erreichbar", "unreachable");
  return t("wird geprüft", "checking");
}

export function ConnectedAppCard({
  slug,
  appName,
  websiteUrl,
  connection,
}: {
  slug: string;
  appName: string;
  websiteUrl: string;
  connection: SavedAppLink | null;
}) {
  const [app, setApp] = useState<LinkState>("checking");
  const t = useT();
  const linked = activeAppLink(slug, connection);
  const linkedUrl = linked?.url ?? "";
  const siteUrl = connection?.url || websiteUrl;

  useEffect(() => {
    if (!linkedUrl) return;
    let stopped = false;

    async function probe() {
      try {
        await fetch(linkedUrl, { mode: "no-cors", cache: "no-store" });
        if (!stopped) setApp("up");
      } catch {
        if (!stopped) setApp("down");
      }
    }

    void probe();
    const timer = window.setInterval(() => void probe(), 8000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [linkedUrl]);

  if (!slug) return null;

  const connected = app === "up";
  const cardClass = "physical-card box-border grid w-full min-w-0 max-w-full gap-1 overflow-hidden rounded-xl px-3 py-3 text-left text-zinc-950";

  return (
    <div className="mb-3 grid min-w-0 gap-2" style={{ marginTop: "2mm" }}>
      {linked ? (
        <a href={linked.url} target="_blank" rel="noreferrer" className={`${cardClass} ${connected ? "feature-integrated" : ""}`}>
          <span className="min-w-0 truncate text-xs font-medium tracking-wide text-zinc-500 uppercase">{t("Verbundene App", "Connected app")}</span>
          <span className="min-w-0 truncate text-sm font-semibold">{linked.name}</span>
          {appName && appName !== linked.name ? <span className="min-w-0 truncate text-xs text-zinc-600">{appName}</span> : null}
          <span className="flex min-w-0 items-center gap-2 text-xs text-zinc-600">
            <span className={`size-2 shrink-0 rounded-full ${connected ? "bg-[#2dd4bf]" : "bg-zinc-400"}`} aria-hidden />
            <span className="min-w-0 truncate">{stateLabel(app, t)}</span>
          </span>
          <span className="min-w-0 truncate font-mono text-[11px] text-zinc-500">{slug}</span>
        </a>
      ) : (
        <div className={cardClass}>
          <span className="min-w-0 truncate text-xs font-medium tracking-wide text-zinc-500 uppercase">{t("Verbundene App", "Connected app")}</span>
          <span className="min-w-0 truncate text-sm font-semibold">{t("Keine App gekoppelt", "No app linked")}</span>
        </div>
      )}
      <div className={cardClass}>
        <span className="min-w-0 truncate text-xs font-medium tracking-wide text-zinc-500 uppercase">{t("Webseite", "Website")}</span>
        {siteUrl ? (
          <a className="min-w-0 truncate text-xs font-medium text-zinc-800 underline" href={siteUrl} target="_blank" rel="noreferrer">
            {siteUrl}
          </a>
        ) : (
          <span className="min-w-0 truncate text-xs text-zinc-500">{t("Noch keine URL", "No URL yet")}</span>
        )}
      </div>
    </div>
  );
}
