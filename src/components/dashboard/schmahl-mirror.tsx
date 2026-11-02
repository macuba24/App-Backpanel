"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveModuleOrder } from "@/actions/modules";
import { OrderSlipPreview } from "@/components/dashboard/order-slip-preview";
import type { PanelTenant } from "@/lib/panel-context";
import type { ModuleKey, PeriodOfferConfig, WeeklyOfferConfig } from "@/modules/schema";
import { isWeeklyOfferActive } from "@/modules/weekly-offer";

function when(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function datedOfferBody(offer: PeriodOfferConfig) {
  return [offer.description, offer.price, offer.validFrom, offer.validUntil].filter(Boolean).join(" · ");
}

function weeklyOfferBody(offer: WeeklyOfferConfig) {
  const start = when(offer.startsAt);
  const end = when(offer.endsAt);
  return [offer.description, offer.price, start ? `Start ${start}` : "", end ? `Ziel ${end}` : ""].filter(Boolean).join(" · ");
}

function flashDealText(deal: { discountValue: string; startsAt: string | null; countdownEnd: string | null }) {
  const start = when(deal.startsAt);
  const end = when(deal.countdownEnd);
  return [deal.discountValue, start ? `Start ${start}` : "", end ? `Ende ${end}` : ""].filter(Boolean).join(" · ");
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <article className="schmahl-benefit">
      <p className="schmahl-benefit-title">{title}</p>
      {body ? <p>{body}</p> : null}
    </article>
  );
}

function sameOrder(left: readonly ModuleKey[], right: readonly ModuleKey[]) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function orderFromModules(modules: PanelTenant["modules"]): ModuleKey[] {
  return Object.keys(modules) as ModuleKey[];
}

function stitch(order: ModuleKey[], visible: ModuleKey[], nextVisible: ModuleKey[]): ModuleKey[] {
  const visibleSet = new Set(visible);
  let cursor = 0;
  return order.map((key) => (visibleSet.has(key) ? nextVisible[cursor++] : key));
}

function featureBody(key: ModuleKey, modules: PanelTenant["modules"]) {
  const stamps = Math.min(4, modules.stampCard.stampCount);

  switch (key) {
    case "stampCard":
      if (!modules.stampCard.enabled) return null;
      return (
        <div className="schmahl-progress-block">
          <p className="schmahl-progress-label">
            Stempel {stamps} von {modules.stampCard.stampCount}
          </p>
          <div className="schmahl-progress" aria-hidden>
            <div
              className="schmahl-progress-fill"
              style={{ width: `${Math.round((stamps / modules.stampCard.stampCount) * 100)}%` }}
            />
          </div>
          <Benefit
            title="Stempelpass"
            body={[modules.stampCard.rewardText, modules.stampCard.redeemCode].filter(Boolean).join(" · ")}
          />
        </div>
      );
    case "challengePass":
      if (!modules.challengePass.enabled) return null;
      return (
        <Benefit
          title="Challenge-Pass"
          body={`${modules.challengePass.visitTarget} Besuche. ${modules.challengePass.rewardText}`}
        />
      );
    case "birthdayGreeting":
      if (!modules.birthdayGreeting.enabled) return null;
      return <Benefit title={modules.birthdayGreeting.title || "Alles Gute!"} body={modules.birthdayGreeting.message} />;
    case "seasonalGreeting":
      if (!modules.seasonalGreeting.enabled) return null;
      return <Benefit title={modules.seasonalGreeting.bannerTitle || "Saisongruß"} body={modules.seasonalGreeting.text} />;
    case "eventCalendar":
      if (!modules.eventCalendar.enabled || modules.eventCalendar.events.length === 0) return null;
      return (
        <div>
          {modules.eventCalendar.events.map((event) => (
            <Benefit
              key={event.id}
              title={event.name || "Event"}
              body={[event.date, event.location, event.description].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
      );
    case "quickPoll":
      if (!modules.quickPoll.enabled) return null;
      return <Benefit title={modules.quickPoll.question || "Umfrage"} body={modules.quickPoll.options.join(" · ")} />;
    case "wheel":
      if (!modules.wheel.enabled) return null;
      return (
        <Benefit title="Tages-Chance" body={modules.wheel.prizes.map((prize) => prize.label).filter(Boolean).join(" · ")} />
      );
    case "flashDeal":
      if (!modules.flashDeal.enabled) return null;
      return <Benefit title={modules.flashDeal.title || "Flash-Deal"} body={flashDealText(modules.flashDeal)} />;
    case "periodOffers":
      if (!modules.periodOffers.enabled) return null;
      return (
        <div>
          <Benefit title={modules.periodOffers.day.title || "Angebot des Tages"} body={datedOfferBody(modules.periodOffers.day)} />
          {isWeeklyOfferActive(modules.periodOffers.week) ? (
            <Benefit
              title={modules.periodOffers.week.title || "Angebot der Woche"}
              body={weeklyOfferBody(modules.periodOffers.week)}
            />
          ) : null}
          <Benefit
            title={modules.periodOffers.month.title || "Angebot des Monats"}
            body={datedOfferBody(modules.periodOffers.month)}
          />
          {modules.periodOffers.photos.some((item) => item.url) ? (
            <div className="schmahl-photos">
              {modules.periodOffers.photos.map((item, index) =>
                item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={index} src={item.url} alt={`Angebotsfoto ${index + 1}`} draggable={false} />
                ) : null,
              )}
            </div>
          ) : null}
        </div>
      );
    case "pushCenter":
      if (!modules.pushCenter.enabled || !modules.pushCenter.title) return null;
      return <Benefit title={modules.pushCenter.title} body={modules.pushCenter.message} />;
    case "geofence":
      if (!modules.geofence.enabled) return null;
      return (
        <Benefit
          title={modules.geofence.title || "Geofencing"}
          body={`${modules.geofence.message} · Umkreis ${modules.geofence.radiusMeters} m`}
        />
      );
    case "orderSlip":
      if (!modules.orderSlip.enabled) return null;
      return <OrderSlipPreview slip={modules.orderSlip} />;
    case "photos":
      if (!modules.photos.enabled || modules.photos.items.length === 0) return null;
      return (
        <div className="schmahl-photos">
          {modules.photos.items.map((item, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.id} src={item.url} alt={`Foto ${index + 1}`} draggable={false} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

type DragState = {
  key: ModuleKey;
  start: ModuleKey[];
};

function shopFacts(tenant: PanelTenant) {
  const facts: { title: string; body: string }[] = [];
  const company = tenant.factory.company;
  if (company.enabled) {
    const body = [company.street, [company.postalCode, company.city].filter(Boolean).join(" "), company.phone, company.hours]
      .filter(Boolean)
      .join(" · ");
    if (company.name || body) facts.push({ title: company.name || "Geschäft", body });
  }
  if (tenant.factory.tiers.enabled) {
    for (const tier of tenant.factory.tiers.items) facts.push({ title: tier.text, body: "" });
  }
  if (tenant.factory.feedback.enabled) {
    facts.push({ title: tenant.factory.feedback.title, body: tenant.factory.feedback.prompt });
  }
  return facts;
}

export function SchmahlMirror({ tenant, canReorder = true }: { tenant: PanelTenant; canReorder?: boolean }) {
  const router = useRouter();
  const modules = tenant.modules;
  const listRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<ModuleKey[]>(orderFromModules(modules));
  const dragRef = useRef<DragState | null>(null);
  const [order, setOrder] = useState<ModuleKey[]>(orderRef.current);
  const [dragging, setDragging] = useState<ModuleKey | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (dragRef.current) return;
    const next = orderFromModules(modules);
    if (sameOrder(orderRef.current, next)) return;
    orderRef.current = next;
    setOrder(next);
  }, [modules]);

  function persist(start: ModuleKey[], next: ModuleKey[]) {
    const started = start.slice();
    const saved = next.slice();
    saveQueue.current = saveQueue.current.then(async () => {
      const result = await saveModuleOrder(tenant.id, saved);
      if (!result.ok) {
        if (!dragRef.current && sameOrder(orderRef.current, saved)) {
          orderRef.current = started;
          setOrder(started);
        }
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!canReorder || event.button !== 0 || dragRef.current) return;
    const key = event.currentTarget.dataset.featureKey as ModuleKey | undefined;
    if (!key) return;
    const rows = listRef.current?.querySelectorAll("[data-feature-key]");
    if (!rows || rows.length < 2) return;
    event.preventDefault();
    dragRef.current = { key, start: orderRef.current.slice() };
    setDragging(key);
    event.currentTarget.setPointerCapture(event.pointerId);

    function move(pointer: PointerEvent) {
      const drag = dragRef.current;
      const list = listRef.current;
      if (!drag || !list) return;
      const items = [...list.querySelectorAll<HTMLElement>("[data-feature-key]")];
      const visible = items.map((row) => row.dataset.featureKey as ModuleKey);
      let index = 0;
      for (const row of items) {
        if (row.dataset.featureKey === drag.key) continue;
        const rect = row.getBoundingClientRect();
        if (pointer.clientY > rect.top + rect.height / 2) index += 1;
      }
      const nextVisible = visible.filter((item) => item !== drag.key);
      nextVisible.splice(index, 0, drag.key);
      const next = stitch(orderRef.current, visible, nextVisible);
      if (sameOrder(orderRef.current, next)) return;
      orderRef.current = next;
      setOrder(next);
    }

    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      const drag = dragRef.current;
      dragRef.current = null;
      setDragging(null);
      if (!drag) return;
      const next = orderRef.current.slice();
      if (sameOrder(drag.start, next)) return;
      persist(drag.start, next);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  const features = order.flatMap((key) => {
    const body = featureBody(key, modules);
    return body ? [{ key, body }] : [];
  });

  return (
    <div className="schmahl-stage">
      <div className="schmahl-phone" aria-label={`Originalansicht ${tenant.appName}`}>
        <header className="schmahl-top">
          <div className="schmahl-logo-band" style={{ background: tenant.branding.primaryColor }}>
            <span className="schmahl-wordmark">{tenant.appName}</span>
          </div>
          <p className="schmahl-role">Kundenapp</p>
        </header>

        <section className="schmahl-block">
          <h2>Kunde</h2>
          {tenant.factory.bonusBar.enabled ? (
            <div className="schmahl-progress-block">
              <div
                className="schmahl-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={35}
                aria-label={tenant.factory.bonusBar.nextText}
              >
                <div className="schmahl-progress-fill" style={{ width: "35%" }} />
              </div>
              <p className="schmahl-progress-label">{tenant.factory.bonusBar.nextText}</p>
            </div>
          ) : null}
          {tenant.branding.welcomeMessage
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, index) => (
              <p key={`${index}-${line}`}>{line}</p>
            ))}
          {features.length === 0
            ? shopFacts(tenant).map((fact) => <Benefit key={fact.title} title={fact.title} body={fact.body} />)
            : null}
          {features.length > 1 && canReorder ? <p className="schmahl-sort-hint">Ziehen zum Sortieren</p> : null}

          <div ref={listRef}>
            {features.map((feature) => (
              <div
                key={feature.key}
                data-feature-key={feature.key}
                className={dragging === feature.key ? "schmahl-feature is-dragging" : "schmahl-feature"}
                onPointerDown={onPointerDown}
                onDragStart={(event) => event.preventDefault()}
              >
                {feature.body}
              </div>
            ))}
          </div>
        </section>

        <p className="schmahl-home">
          {tenant.factory.homepage.enabled && tenant.factory.homepage.url ? (
            <a href={tenant.factory.homepage.url} target="_blank" rel="noreferrer">
              {tenant.factory.homepage.url}
            </a>
          ) : (
            <span>Homepage</span>
          )}
        </p>

        <nav className="schmahl-switch" aria-label="Eingang">
          <span className="is-on">Kunde</span>
          <span>Kasse</span>
        </nav>
      </div>
    </div>
  );
}
