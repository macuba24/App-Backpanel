import type { PanelTenant } from "@/lib/panel-context";
import type { SavedAppLink } from "@/lib/app-catalog";
import { shopHomepage } from "@/lib/shop-urls";
import { defaultActiveModules } from "@/modules/defaults";
import { defaultFactory, type FactoryConfig } from "@/modules/factory";

/**
 * What the panel shows for the connected app.
 * The logged-in account can be a different shop. Name, website and preview follow the connection.
 */
export function connectedIdentity(account: PanelTenant): {
  name: string;
  slug: string;
  websiteUrl: string;
  preview: PanelTenant;
} {
  const link = account.connection;
  if (!link) {
    return {
      name: account.name,
      slug: account.slug,
      websiteUrl: account.factory.homepage.enabled ? account.factory.homepage.url : "",
      preview: account,
    };
  }

  const ownShop = link.slug === account.slug;
  const stored = ownShop ? { ...account, name: link.name, appName: link.name, slug: link.slug } : faceFor(link);
  const preview = link.slug === "lahr" ? lahrPreview(stored, link) : stored;
  return {
    name: link.name,
    slug: link.slug,
    websiteUrl: shopHomepage(link.slug) || link.url,
    preview: pinWebsite(preview, link),
  };
}

/** Keeps the Lahr preview copy. Factory and modules still come from the stored app. */
function lahrPreview(stored: PanelTenant, link: SavedAppLink): PanelTenant {
  const face = lahrFace(link);
  return {
    ...face,
    id: stored.id,
    apiKey: stored.apiKey,
    factory: stored.factory,
    modules: stored.modules,
    branding: {
      ...face.branding,
      primaryColor: stored.branding.primaryColor || face.branding.primaryColor,
      logoUrl: stored.branding.logoUrl,
      welcomeMessage: face.branding.welcomeMessage,
    },
  };
}

/** Built-in face when the connected shop is not the account currently open. */
export function faceFor(link: SavedAppLink): PanelTenant {
  if (link.slug === "lahr") return lahrFace(link);
  return genericFace(link);
}

function pinWebsite(tenant: PanelTenant, link: SavedAppLink): PanelTenant {
  return {
    ...tenant,
    connection: link,
    factory: {
      ...tenant.factory,
      homepage: { enabled: true, label: "Homepage", url: shopHomepage(link.slug) || link.url },
    },
  };
}

function lahrFace(link: SavedAppLink): PanelTenant {
  const factory: FactoryConfig = {
    bonusBar: {
      enabled: true,
      nextText: "Noch {betrag} bis zur nächsten Stufe.",
      topText: "Die höchste Stufe ist erreicht.",
    },
    tiers: {
      enabled: true,
      items: [
        { amountEuro: 1000, percent: 1, text: "1 Prozent auf den Einkauf" },
        { amountEuro: 3000, percent: 2, text: "2 Prozent auf den Einkauf" },
        { amountEuro: 5000, percent: 3, text: "3 Prozent auf den Einkauf" },
        { amountEuro: 10000, percent: 5, text: "5 Prozent auf den Einkauf" },
      ],
    },
    name: { enabled: true, label: "Name" },
    address: { enabled: true, label: "Adresse" },
    birthday: { enabled: true, label: "Geburtstag" },
    customerNumber: { enabled: true, label: "Kundennummer" },
    customerCode: {
      enabled: true,
      label: "Kunden-Code erzeugen",
      hint: "Danach entsteht der Kunden-Code. Er bleibt auf diesem Handy.",
    },
    receipt: {
      enabled: true,
      title: "Rechnungsspeicher",
      hint: "Fotografieren Sie den Kassenbon und tragen Sie den Betrag ein. Das Foto bleibt als Beleg gespeichert.",
      buttonLabel: "Rechnung scannen",
    },
    feedback: {
      enabled: true,
      title: "INFO an LAHR SCHUHE",
      prompt: "Was finden Sie gut, was finden Sie schlecht?",
    },
    company: {
      enabled: true,
      name: "LAHR SCHUHE",
      street: "Löhrstr. 51",
      district: "",
      postalCode: "56068",
      city: "Koblenz",
      phone: "+49 (0) 261 100061",
      hours: "Öffnungszeiten stehen im Filialfinder",
    },
    homepage: { enabled: true, label: "Homepage", url: link.url },
  };

  return {
    id: `connected:${link.slug}`,
    name: link.name,
    slug: link.slug,
    appName: link.name,
    apiKey: "",
    branding: {
      primaryColor: "#71abd9",
      logoUrl: "",
      welcomeMessage: [
        "Willkommen bei LAHR SCHUHE.",
        "Das ganze Jahr der Schuh von Lahr.",
        "Seit 1912. Über 600 Mitarbeiter in rund 50 Fachgeschäften und Fachmärkten.",
        "Sortiment: Damen, Herren, Kinder, Sport und Accessoires.",
      ].join("\n"),
    },
    modules: defaultActiveModules,
    factory,
    connection: link,
  };
}

function genericFace(link: SavedAppLink): PanelTenant {
  const factory: FactoryConfig = {
    ...defaultFactory,
    bonusBar: { ...defaultFactory.bonusBar, enabled: false },
    tiers: {
      enabled: false,
      items: defaultFactory.tiers.items.map((item) => ({
        ...item,
        text: item.text.replace(" und eine Arbeitshose", ""),
      })),
    },
    receipt: { ...defaultFactory.receipt, enabled: false },
    feedback: {
      enabled: false,
      title: `INFO an ${link.name}`,
      prompt: "Was finden Sie gut, was finden Sie schlecht?",
    },
    company: {
      enabled: true,
      name: link.name,
      street: "",
      district: "",
      postalCode: "",
      city: "",
      phone: "",
      hours: "",
    },
    homepage: { enabled: true, label: "Homepage", url: link.url },
  };

  return {
    id: `connected:${link.slug}`,
    name: link.name,
    slug: link.slug,
    appName: link.name,
    apiKey: "",
    branding: {
      primaryColor: "#27272a",
      logoUrl: "",
      welcomeMessage: "",
    },
    modules: defaultActiveModules,
    factory,
    connection: link,
  };
}
