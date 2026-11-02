import { lahrAppUrl, linkedApp, schmahlAppUrl } from "@/lib/shop-urls";

export type SavedAppLink = {
  slug: string;
  name: string;
  url: string;
};

export type RejectReason = "empty" | "wifi" | "contact" | "payment" | "not-link" | "unknown";

export type LinkDecision =
  | { ok: true; app: SavedAppLink }
  | { ok: false; reason: RejectReason };

type KnownApp = {
  slug: string;
  name: string;
  hosts: string[];
  pathIncludes?: string[];
};

/** Customer apps in this shop family. A link must match one of these. Nothing else is connected. */
const KNOWN_APPS: KnownApp[] = [
  { slug: "lahr", name: "LAHR SCHUHE", hosts: ["schuh-frank.de"], pathIncludes: ["lahr-schuhe"] },
  { slug: "schmahl", name: "Schmahl GmbH", hosts: ["gartentechnik-koblenz.de"] },
  { slug: "de-filippo", name: "DE FILIPPO uomo", hosts: ["defilippo-uomo.de"] },
  { slug: "zweirad-sturm", name: "Zweirad Sturm GmbH", hosts: ["ktm-sturm.de"] },
  { slug: "le-marche", name: "Le Marché", hosts: ["le-marche-koblenz.de"] },
  { slug: "wajos", name: "Wajos Feinkost Koblenz", hosts: ["wajos.de"] },
  { slug: "pfeffersack", name: "Pfeffersack & Soehne", hosts: ["pfeffersackundsoehne.de"] },
  { slug: "biwakschachtel", name: "Biwakschachtel", hosts: ["biwakschachtel.de"] },
  { slug: "krumholz", name: "Intersport Krumholz", hosts: ["sporthaus.de"] },
];

const PAYMENT_HOSTS = ["paypal.com", "paypal.me", "pay.google.com", "checkout.stripe.com", "buy.stripe.com", "venmo.com", "cash.app"];

function hostMatches(hostname: string, host: string) {
  return hostname === host || hostname.endsWith(`.${host}`);
}

function knownByWebsite(url: URL): KnownApp | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.toLowerCase();
  return (
    KNOWN_APPS.find((app) => {
      if (!app.hosts.some((item) => hostMatches(host, item))) return false;
      if (!app.pathIncludes?.length) return true;
      return app.pathIncludes.some((part) => path.includes(part));
    }) ?? null
  );
}

function knownByLocalApp(url: URL): KnownApp | null {
  const locals = [
    { origin: originOf(lahrAppUrl), slug: "lahr", name: "LAHR SCHUHE" },
    { origin: originOf(schmahlAppUrl), slug: "schmahl", name: "Schmahl GmbH" },
  ];
  const found = locals.find((item) => item.origin !== null && item.origin === url.origin);
  if (!found) return null;
  return { slug: found.slug, name: found.name, hosts: [] };
}

function originOf(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function asHttpUrl(raw: string): URL | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function isPayment(raw: string, url: URL | null) {
  if (/^(bitcoin|lightning|payto|sepa):/i.test(raw) || raw.startsWith("BCD\n") || raw.startsWith("BCD\r\n")) return true;
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return PAYMENT_HOSTS.some((item) => hostMatches(host, item));
}

/** Turns a QR payload or a pasted link into one known app, or a reason to refuse. */
export function recognizeAppLink(input: string): LinkDecision {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: "empty" };
  if (/^WIFI:/i.test(raw)) return { ok: false, reason: "wifi" };
  if (/^BEGIN:VCARD/i.test(raw) || /^MECARD:/i.test(raw)) return { ok: false, reason: "contact" };

  const url = asHttpUrl(raw);
  if (isPayment(raw, url)) return { ok: false, reason: "payment" };
  if (!url) return { ok: false, reason: "not-link" };

  const app = knownByWebsite(url) ?? knownByLocalApp(url);
  if (!app) return { ok: false, reason: "unknown" };
  return { ok: true, app: { slug: app.slug, name: app.name, url: url.href } };
}

export function activeAppLink(slug: string, saved: SavedAppLink | null): { name: string; url: string } | null {
  if (saved) return { name: saved.name, url: saved.url };
  return linkedApp(slug);
}

export function readSavedAppLink(config: {
  connectedSlug?: string | null;
  connectedName?: string | null;
  connectedUrl?: string | null;
} | null | undefined): SavedAppLink | null {
  const slug = config?.connectedSlug?.trim() ?? "";
  const name = config?.connectedName?.trim() ?? "";
  const url = config?.connectedUrl?.trim() ?? "";
  if (!slug || !name || !url) return null;
  return { slug, name, url };
}
