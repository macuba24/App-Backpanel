import { z } from "zod";

const label = (name: string) => z.string().trim().min(1, `${name} ist erforderlich.`).max(80);

const switchable = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ enabled: z.boolean(), ...shape });

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || z.string().url().safeParse(value).success, "Bitte eine gültige Homepage-Adresse eingeben.");

export const factoryTierSchema = z.object({
  amountEuro: z.number().int().min(1, "Mindestens 1 Euro.").max(1_000_000, "Höchstens 1.000.000 Euro."),
  percent: z.number().int().min(0, "Mindestens 0 Prozent.").max(100, "Höchstens 100 Prozent."),
  text: z.string().trim().min(1, "Der Stufentext ist erforderlich.").max(240, "Der Stufentext ist zu lang."),
});

export const factorySchema = z.object({
  bonusBar: switchable({
    nextText: z.string().trim().min(1, "Der Text des Bonusbalkens ist erforderlich.").max(200),
    topText: z.string().trim().min(1, "Der Text der höchsten Stufe ist erforderlich.").max(200),
  }),
  tiers: switchable({
    items: z.array(factoryTierSchema).min(1, "Mindestens eine Bonusstufe.").max(8, "Höchstens acht Bonusstufen."),
  }),
  name: switchable({ label: label("Name") }),
  address: switchable({ label: label("Adresse") }),
  birthday: switchable({ label: label("Geburtstag") }),
  customerNumber: switchable({ label: label("Kundennummer") }),
  customerCode: switchable({
    label: label("Kunden-Code"),
    hint: z.string().trim().max(240),
  }),
  receipt: switchable({
    title: label("Rechnungsscanner"),
    hint: z.string().trim().max(400),
    buttonLabel: label("Scan-Button"),
  }),
  feedback: switchable({
    title: label("Kundenfeedback"),
    prompt: z.string().trim().min(1, "Der Feedback-Text ist erforderlich.").max(240),
  }),
  company: switchable({
    name: z.string().trim().min(1, "Der Firmenname ist erforderlich.").max(120),
    street: z.string().trim().max(120),
    district: z.string().trim().max(120),
    postalCode: z.string().trim().max(12),
    city: z.string().trim().max(80),
    phone: z.string().trim().max(40),
    hours: z.string().trim().max(240),
  }),
  homepage: switchable({
    label: label("Homepage"),
    url: optionalUrl,
  }),
});

export type FactoryConfig = z.infer<typeof factorySchema>;
export type FactoryKey = keyof FactoryConfig;

/** Delivered Schmahl baseline. Restoring the Ausgangssituation writes this object back. */
export const defaultFactory: FactoryConfig = {
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
      { amountEuro: 10000, percent: 5, text: "5 Prozent auf den Einkauf und eine Arbeitshose" },
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
    hint: "Fotografieren Sie den Kassenbon und tragen Sie den Betrag ein. Das Foto bleibt als Beleg gespeichert. Dieselbe Rechnung kann nicht ein zweites Mal zählen.",
    buttonLabel: "Rechnung scannen",
  },
  feedback: {
    enabled: true,
    title: "INFO an Firma Schmahl",
    prompt: "Was finden Sie gut, was finden Sie schlecht?",
  },
  company: {
    enabled: true,
    name: "Schmahl GmbH",
    street: "Carl-Spaeter-Straße 13",
    district: "Industriegebiet Rheinhafen",
    postalCode: "56070",
    city: "Koblenz",
    phone: "0261 / 30488-0",
    hours: "Mo.–Fr. 7.30–17.00 Uhr\nSamstags geschlossen",
  },
  homepage: {
    enabled: true,
    label: "Homepage",
    url: "https://www.gartentechnik-koblenz.de/",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFactory(value: unknown): FactoryConfig {
  const source = isRecord(value) ? value : {};
  const merged: Record<string, unknown> = {};
  for (const key of Object.keys(defaultFactory) as FactoryKey[]) {
    const base = defaultFactory[key];
    const patch = source[key];
    merged[key] = isRecord(patch) ? { ...base, ...patch } : base;
  }
  const parsed = factorySchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultFactory;
}
