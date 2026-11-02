"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { LayoutDashboard, Menu, Palette, QrCode, Settings2, SlidersHorizontal, Smartphone, UserRound } from "lucide-react";
import { cn } from "cn";

import { logout } from "@/actions/auth";
import { ConnectedAppCard } from "@/components/dashboard/app-connector";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type SavedAppLink } from "@/lib/app-catalog";
import { useLocale, useT, type Lang } from "@/lib/locale";
import { linkedApp } from "@/lib/shop-urls";

const NAV = [
  { href: "/", de: "Übersicht", en: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/connect", de: "App verbinden", en: "Connect app", icon: QrCode },
  { href: "/dashboard/modules", de: "Modul-Manager", en: "Module manager", icon: SlidersHorizontal },
  { href: "/dashboard/factory", de: "Werkseinstellung", en: "Factory settings", icon: Settings2 },
  { href: "/dashboard/profile", de: "Persönliche Daten", en: "Personal details", icon: UserRound },
  { href: "/dashboard/design", de: "controlpanel design", en: "controlpanel design", icon: Palette },
];

const PREVIEW_HREF = "/dashboard/preview";

const PAGE_COPY: { test: (pathname: string) => boolean; de: string; en: string; detailDe: string; detailEn: string }[] = [
  {
    test: (pathname) => pathname === "/" || pathname === "/dashboard",
    de: "Übersicht",
    en: "Overview",
    detailDe: "Status Ihrer App: Farbe, Schlüssel und eingeschaltete Module.",
    detailEn: "Status of your app: colour, key and enabled modules.",
  },
  {
    test: (pathname) => pathname.startsWith("/dashboard/connect"),
    de: "App verbinden",
    en: "Connect app",
    detailDe: "QR-Code oder Link einfügen, um die passende App zu verbinden.",
    detailEn: "Paste a QR code or a link to connect the matching app.",
  },
  {
    test: (pathname) => pathname.startsWith("/dashboard/modules") || pathname.startsWith("/dashboard/content"),
    de: "Modul-Manager",
    en: "Module manager",
    detailDe: "Jede Karte speichert nur ihre eigenen Module.",
    detailEn: "Each card saves only its own modules.",
  },
  {
    test: (pathname) => pathname.startsWith("/dashboard/design"),
    de: "controlpanel design",
    en: "controlpanel design",
    detailDe: "Farbe, Logo und Willkommensnachricht Ihrer App.",
    detailEn: "Colour, logo and welcome message of your app.",
  },
  {
    test: (pathname) => pathname.startsWith("/dashboard/factory"),
    de: "Werkseinstellung",
    en: "Factory settings",
    detailDe: "Ausgangssituation der App. Was nicht gefällt, können Sie wegnehmen.",
    detailEn: "The delivered setup of the app. Switch off anything you do not want.",
  },
  {
    test: (pathname) => pathname.startsWith(PREVIEW_HREF),
    de: "App Vorschau",
    en: "App preview",
    detailDe: "Originalansicht der gekoppelten Kunden-App.",
    detailEn: "Original view of the linked customer app.",
  },
  {
    test: (pathname) => pathname.startsWith("/dashboard/profile"),
    de: "Persönliche Daten",
    en: "Personal details",
    detailDe: "Name, E-Mail und Passwort dieses Kontos.",
    detailEn: "Name, email and password of this account.",
  },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageCopy(pathname: string, lang: Lang) {
  const page = PAGE_COPY.find((item) => item.test(pathname));
  if (!page) {
    return lang === "en"
      ? { title: "Merchant panel", description: "Control of your customer app." }
      : { title: "Händler-Panel", description: "Steuerung Ihrer Kunden-App." };
  }
  return lang === "en"
    ? { title: page.en, description: page.detailEn }
    : { title: page.de, description: page.detailDe };
}

function LanguageSwitch() {
  const { lang, setLang } = useLocale();
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("Sprache", "Language")}
      className="flex shrink-0 rounded-lg border-2 border-black bg-white p-0.5"
    >
      {(["de", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
            lang === code ? "bg-black text-white" : "text-zinc-600",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function NavLinks({
  pathname,
  displayName,
  email,
  appName,
  slug,
  websiteUrl,
  connection,
  onNavigate,
}: {
  pathname: string;
  displayName: string;
  email: string;
  appName: string;
  slug: string;
  websiteUrl: string;
  connection: SavedAppLink | null;
  onNavigate?: () => void;
}) {
  const t = useT();
  const { lang } = useLocale();
  return (
    <nav className="grid min-w-0 content-start gap-1 overflow-x-hidden">
      <div className="grid min-w-0 gap-1 px-3">
      <ConnectedAppCard slug={slug} appName={appName} websiteUrl={websiteUrl} connection={connection} />
      {NAV.filter((item) => item.href !== "/dashboard/design").map((item) => {
        const active = isCurrent(pathname, item.href);
        const Icon = item.icon;
        if (item.href === "/dashboard/profile") {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "physical-card mt-3 box-border grid min-w-0 gap-1 overflow-hidden rounded-xl px-3 py-3 text-left text-zinc-950",
                active && "ring-2 ring-black",
              )}
            >
              <span className="flex min-w-0 items-center gap-2 truncate text-xs font-medium tracking-wide text-zinc-500 uppercase">
                <Icon className="size-3.5" aria-hidden />
                {t("Persönliche Daten", "Personal details")}
              </span>
              <span className="truncate text-sm font-semibold">{displayName}</span>
              <span className="truncate text-xs text-zinc-500">{email}</span>
            </Link>
          );
        }
        const link = (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white",
              active && "bg-white/10 font-medium text-white",
              item.href === "/dashboard/factory" && "border border-white font-medium text-white",
              active && (item.href === "/dashboard/modules" || item.href === "/dashboard/factory") && "nav-current",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {lang === "en" ? item.en : item.de}
          </Link>
        );
        if (item.href !== "/dashboard/factory") return <Fragment key={item.href}>{link}</Fragment>;
        const previewActive = isCurrent(pathname, PREVIEW_HREF);
        return (
          <Fragment key={item.href}>
            {link}
            <Link
              href={PREVIEW_HREF}
              aria-current={previewActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "physical-card mt-3 box-border grid min-w-0 gap-1 overflow-hidden rounded-xl px-3 py-3 text-left text-zinc-950",
                previewActive && "nav-current",
              )}
            >
              <span className="flex min-w-0 items-center gap-2 truncate text-xs font-medium tracking-wide text-zinc-500 uppercase">
                <Smartphone className="size-3.5" aria-hidden />
                {t("App Vorschau", "App preview")}
              </span>
              <span className="truncate text-sm font-semibold">{connection?.name || appName || t("Keine App", "No app")}</span>
            </Link>
          </Fragment>
        );
      })}
      </div>
    </nav>
  );
}

function DesignNavLink({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { lang } = useLocale();
  const item = NAV.find((entry) => entry.href === "/dashboard/design");
  if (!item) return null;
  const active = isCurrent(pathname, item.href);
  const Icon = item.icon;
  return (
    <div className="shrink-0 px-3 pb-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white",
          active && "bg-white/10 font-medium text-white",
        )}
      >
        <Icon className="size-4" aria-hidden />
        {lang === "en" ? item.en : item.de}
      </Link>
    </div>
  );
}

function EmergencyNumber() {
  const t = useT();
  return (
    <div className="shrink-0 px-3 pb-3">
      <div className="physical-card grid gap-2 rounded-xl px-3 py-3 text-left text-zinc-950">
        <div className="grid gap-1">
          <p className="text-xs font-medium leading-snug tracking-wide text-zinc-500 uppercase">
            {t("Support und Störungsannahmen", "Support and incident reports")}
          </p>
          <a href="mailto:info@hampacorequality.de" className="text-sm font-semibold break-all">
            info@hampacorequality.de
          </a>
        </div>
        <div className="grid gap-1 border-t border-black/10 pt-2">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{t("Notfallnummer", "Emergency number")}</p>
          <p className="text-sm font-semibold leading-snug">Rainer Hampicke</p>
          <a href="tel:0155560594897" className="text-sm font-medium tracking-tight">
            0155560594897
          </a>
        </div>
        <Link href="/impressum" className="text-sm font-semibold underline">
          {t("Impressum", "Legal notice")}
        </Link>
      </div>
    </div>
  );
}

function AccountFooter({ email }: { email: string }) {
  const t = useT();
  return (
    <div className="mt-auto border-t border-white/10 p-3">
      <p className="truncate px-2 pb-2 text-xs text-zinc-400" title={email}>
        {email}
      </p>
      <form action={logout}>
        <Button type="submit" variant="outline" className="w-full">
          {t("Abmelden", "Log out")}
        </Button>
      </form>
    </div>
  );
}

export function AppShell({
  email,
  displayName,
  tenantName,
  appName,
  slug,
  websiteUrl,
  connection,
  children,
}: {
  email: string;
  displayName: string;
  tenantName: string;
  appName: string;
  slug: string;
  websiteUrl: string;
  connection: SavedAppLink | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useLocale();
  const t = useT();
  const page = pageCopy(pathname, lang);
  const customerApp = linkedApp(connection?.slug || slug);
  const shownTenant = tenantName === "Datenbank nicht erreichbar"
    ? t("Datenbank nicht erreichbar", "Database unreachable")
    : tenantName;

  return (
    <div className="desk flex h-svh overflow-hidden text-zinc-950">
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-black bg-zinc-950 text-white shadow-[8px_0_24px_-12px_rgba(0,0,0,0.55)] md:flex">
        <div className="flex shrink-0 items-center gap-3 px-5 py-6">
          <img src="/hcq-logo.png" alt="" className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-white">{t("Händler-Panel", "Merchant panel")}</p>
            <p className="mt-1 truncate text-sm text-zinc-400">{shownTenant}</p>
          </div>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <NavLinks pathname={pathname} displayName={displayName} email={email} appName={appName} slug={slug} websiteUrl={websiteUrl} connection={connection} />
        </div>
        <DesignNavLink pathname={pathname} />
        <EmergencyNumber />
        <AccountFooter email={email} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-black/10 bg-white/80 px-4 py-4 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.45)] md:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-0.5 md:hidden"
              aria-label={t("Menü", "Menu")}
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold tracking-tight">{page.title}</h1>
              <p className="mt-1 text-sm text-zinc-500">{page.description}</p>
            </div>
            <LanguageSwitch />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto grid w-full max-w-5xl gap-8">{children}</div>
        </main>
      </div>

      <aside className="flex h-full w-40 shrink-0 items-center justify-center border-l border-black bg-[#d0d0d4] px-3">
        {customerApp ? (
          <Button asChild className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center text-white">
            <a href={customerApp.url} target="_blank" rel="noreferrer">
              App Loading
            </a>
          </Button>
        ) : (
          <Button disabled className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center">
            {t("Keine App", "No app")}
          </Button>
        )}
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-60 bg-white p-0 sm:max-w-none">
          <SheetHeader className="border-b border-zinc-200 text-left">
            <SheetTitle className="flex items-center gap-2">
              <img src="/hcq-logo.png" alt="" className="size-8 rounded-lg" />
              {t("Händler-Panel", "Merchant panel")}
            </SheetTitle>
            <SheetDescription>{shownTenant}</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-zinc-950 py-3 text-white">
            <NavLinks
              pathname={pathname}
              displayName={displayName}
              email={email}
              appName={appName}
              slug={slug}
              websiteUrl={websiteUrl}
              connection={connection}
              onNavigate={() => setMenuOpen(false)}
            />
            <DesignNavLink pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <EmergencyNumber />
            <AccountFooter email={email} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
