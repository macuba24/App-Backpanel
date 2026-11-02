/** Addresses other devices in the shop use. Inlined at build time. */
export const panelUrl = (process.env.NEXT_PUBLIC_PANEL_URL || "http://192.168.178.124:3000").replace(/\/$/, "");

export const schmahlAppUrl = process.env.NEXT_PUBLIC_SCHMAHL_APP_URL || "https://schmahl-bonus-app.onrender.com/";

export const lahrAppUrl = process.env.NEXT_PUBLIC_LAHR_APP_URL || "http://192.168.178.124:8771/";

/** Customer app opened by App Loading. The website card keeps the shop homepage. */
export function linkedApp(slug: string): { name: string; url: string } | null {
  if (slug === "lahr") return { name: "LAHR SCHUHE", url: lahrAppUrl };
  if (slug === "schmahl") return { name: "Schmahl GmbH", url: schmahlAppUrl };
  return null;
}

/** Company homepage. This is never the customer app address. */
export function shopHomepage(slug: string): string {
  if (slug === "lahr") return "https://www.schuh-frank.de/lahr-schuhe-koblenz";
  if (slug === "schmahl") return "https://www.gartentechnik-koblenz.de/";
  return "";
}
