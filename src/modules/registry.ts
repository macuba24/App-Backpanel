import {
  Bell,
  Cake,
  CalendarDays,
  Disc3,
  Flag,
  ListChecks,
  Snowflake,
  Stamp,
  ClipboardList,
  MapPin,
  Images,
  Tags,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { ModuleKey } from "@/modules/schema";

export type ModuleCategoryId = "gamification" | "dialog" | "marketing" | "push" | "photos" | "offers" | "order" | "geofence";

export type ModuleDefinition = {
  label: string;
  description: string;
  category: ModuleCategoryId;
  icon: LucideIcon;
};

export const moduleRegistry = {
  stampCard: {
    label: "Digitaler Stempelpass",
    description: "Kunden sammeln Stempel und lösen eine Belohnung mit einem Code ein.",
    category: "gamification",
    icon: Stamp,
  },
  wheel: {
    label: "Glücksrad / Tages-Chance",
    description: "Eine Drehung pro Zeitraum, mit eigener Gewinnwahrscheinlichkeit.",
    category: "gamification",
    icon: Disc3,
  },
  challengePass: {
    label: "Challenge-Pass",
    description: "Belohnung nach einer festen Anzahl von Besuchen.",
    category: "gamification",
    icon: Flag,
  },
  quickPoll: {
    label: "Quick-Polls",
    description: "Kurze Umfrage mit frei pflegbaren Antwortoptionen.",
    category: "dialog",
    icon: ListChecks,
  },
  birthdayGreeting: {
    label: "Automatisierter Geburtstagsgruß",
    description: "Persönlicher Gruß mit Gutschein, Gültigkeit und Barcode.",
    category: "marketing",
    icon: Cake,
  },
  seasonalGreeting: {
    label: "Saison- & Weihnachtsgrüße",
    description: "Banner mit Zeitraum für saisonale Ansprache.",
    category: "marketing",
    icon: Snowflake,
  },
  eventCalendar: {
    label: "Event-Kalender",
    description: "Mehrere Termine mit optionalem Teilnahme-Button.",
    category: "marketing",
    icon: CalendarDays,
  },
  pushCenter: {
    label: "Push-Nachrichten-Zentrale",
    description: "Entwurf für eine Push-Nachricht. Der Versand wird nur vorgemerkt.",
    category: "push",
    icon: Bell,
  },
  flashDeal: {
    label: "Flash-Deals",
    description: "Kurzfristige Aktion mit Countdown.",
    category: "push",
    icon: Zap,
  },
  periodOffers: {
    label: "Angebot des Tages, der Woche und des Monats",
    description: "Drei Angebote mit Titel, Beschreibung, Preis und fünf eigenen Fotos. Das Angebot der Woche braucht Startzeitpunkt und Zielzeitpunkt.",
    category: "offers",
    icon: Tags,
  },
  photos: {
    label: "Fotos",
    description: "Bis zu drei Fotos für die Kunden-App.",
    category: "photos",
    icon: Images,
  },
  orderSlip: {
    label: "Bestellzettel",
    description: "Zettel mit Artikel und Menge. Das Zahlungssystem richtet der Händler selbst ein.",
    category: "order",
    icon: ClipboardList,
  },
  geofence: {
    label: "Geofencing",
    description: "Hinweis, wenn das Handy im Umkreis des Geschäfts ist.",
    category: "geofence",
    icon: MapPin,
  },
} satisfies Record<ModuleKey, ModuleDefinition>;

export const moduleOrder = Object.keys(moduleRegistry) as ModuleKey[];

export const categoryRegistry = [
  {
    id: "gamification",
    title: "Gamification & Loyalty",
    description: "Bindung über Stempel, Glücksrad und Besuchs-Challenges.",
    keys: ["stampCard", "wheel", "challengePass"],
  },
  {
    id: "dialog",
    title: "Dialog & Auswertung",
    description: "Kurze Umfragen aus der Kunden-App.",
    keys: ["quickPoll"],
  },
  {
    id: "marketing",
    title: "Personalisiertes Marketing",
    description: "Geburtstage, Saisonbotschaften und Veranstaltungen.",
    keys: ["birthdayGreeting", "seasonalGreeting", "eventCalendar"],
  },
  {
    id: "push",
    title: "Push & Direct Marketing",
    description: "Mitteilungen auf dem Handy, auch wenn die App zu ist, und zeitlich begrenzte Angebote.",
    keys: ["pushCenter", "flashDeal"],
  },
  {
    id: "photos",
    title: "Fotos",
    description: "Bis zu drei Fotos, die in der Kunden-App erscheinen.",
    keys: ["photos"],
  },
  {
    id: "order",
    title: "Bestellung",
    description: "Bestellzettel mit Pflichtangaben. Die Zahlung bleibt beim Zahlungssystem des Geschäfts.",
    keys: ["orderSlip"],
  },
  {
    id: "geofence",
    title: "Geofencing",
    description: "Hinweis im Umkreis des Geschäfts. Der Standort bleibt auf dem Handy.",
    keys: ["geofence"],
  },
  {
    id: "offers",
    title: "Angebot des Tages, der Woche und des Monats",
    description: "Tages-, Wochen- und Monatsangebot mit fünf Fotoplätzen. Das Wochenangebot gilt vom Startzeitpunkt bis vor dem Zielzeitpunkt.",
    keys: ["periodOffers"],
  },
] as const satisfies readonly {
  id: ModuleCategoryId;
  title: string;
  description: string;
  keys: readonly ModuleKey[];
}[];

export type CategoryId = (typeof categoryRegistry)[number]["id"];
