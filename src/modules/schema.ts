import { z } from "zod";

const requiredNumber = (label: string) =>
  z.number({
    invalid_type_error: `${label} muss eine Zahl sein.`,
    required_error: `${label} ist erforderlich.`,
  });

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Bitte eine gültige E-Mail eingeben oder das Feld leer lassen.",
  );

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => value === "" || z.string().url().safeParse(value).success,
    "Bitte eine gültige URL eingeben oder das Feld leer lassen.",
  );

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT erwartet.");

const isoDateTime = z
  .string()
  .datetime({ offset: true, message: "Ungültiges Datum." });

export const stampCardSchema = z.object({
  enabled: z.boolean(),
  stampCount: requiredNumber("Stempelanzahl").int().min(1, "Mindestens 1 Stempel.").max(100, "Höchstens 100 Stempel."),
  rewardText: z.string().trim().max(500, "Belohnungstext ist zu lang."),
  redeemCode: z.string().trim().max(64, "Einlöse-Code ist zu lang."),
});

export const wheelPrizeSchema = z.object({
  label: z.string().trim().min(1, "Bezeichnung ist erforderlich.").max(120),
  probabilityPercent: requiredNumber("Wahrscheinlichkeit").min(0, "Mindestens 0 %.").max(100, "Höchstens 100 %."),
});

export const wheelSchema = z.object({
  enabled: z.boolean(),
  winProbabilityPercent: requiredNumber("Gewinnwahrscheinlichkeit")
    .min(0, "Mindestens 0 %.")
    .max(100, "Höchstens 100 %."),
  cooldownHours: requiredNumber("Abklingzeit").int().min(0, "Mindestens 0 Stunden.").max(8760, "Höchstens 8760 Stunden."),
  prizes: z.array(wheelPrizeSchema).min(1, "Mindestens ein Gewinngutschein.").max(20),
});

export const challengePassSchema = z.object({
  enabled: z.boolean(),
  visitTarget: requiredNumber("Zielanzahl").int().min(1, "Mindestens 1 Besuch.").max(365, "Höchstens 365 Besuche."),
  rewardText: z.string().trim().max(500, "Belohnungstext ist zu lang."),
});

export const quickPollSchema = z.object({
  enabled: z.boolean(),
  question: z.string().trim().max(500, "Umfragefrage ist zu lang."),
  options: z
    .array(z.string().trim().min(1, "Antwortoption darf nicht leer sein.").max(200))
    .min(2, "Mindestens zwei Antwortoptionen.")
    .max(12, "Höchstens zwölf Antwortoptionen."),
});

export const birthdayGreetingSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(120, "Gruß-Titel ist zu lang."),
  message: z.string().trim().max(2000, "Gruß-Nachricht ist zu lang."),
  discountType: z.enum(["percent", "fixed", "gift"]),
  discountValue: z.string().trim().max(120, "Gutscheinwert ist zu lang."),
  redemptionTerms: z.string().trim().max(1000, "Einlösebedingungen sind zu lang."),
  validDays: requiredNumber("Gültigkeit").int().min(1, "Mindestens 1 Tag.").max(365, "Höchstens 365 Tage."),
  barcodeType: z.enum(["QR_CODE", "CODE128", "EAN13", "TEXT_CODE"]),
});

export const seasonalGreetingSchema = z
  .object({
    enabled: z.boolean(),
    bannerTitle: z.string().trim().max(160, "Banner-Titel ist zu lang."),
    text: z.string().trim().max(2000, "Text ist zu lang."),
    imageUrl: optionalUrl,
    startDate: isoDate.nullable(),
    endDate: isoDate.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Das Enddatum liegt vor dem Startdatum.",
      });
    }
  });

export const calendarEventSchema = z.object({
  id: z.string().uuid("Event-ID ist ungültig."),
  name: z.string().trim().min(1, "Name ist erforderlich.").max(160),
  date: isoDate.nullable(),
  location: z.string().trim().max(200, "Ort ist zu lang."),
  description: z.string().trim().max(2000, "Beschreibung ist zu lang."),
  rsvpEnabled: z.boolean(),
});

export const eventCalendarSchema = z.object({
  enabled: z.boolean(),
  events: z.array(calendarEventSchema).max(50, "Höchstens 50 Events."),
});

export const pushCenterSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(120, "Titel ist zu lang."),
  message: z.string().trim().max(1000, "Nachrichtentext ist zu lang."),
  deepLink: z.string().trim().max(500, "Deep-Link ist zu lang."),
  lastQueuedAt: isoDateTime.nullable(),
});

export const flashDealSchema = z
  .object({
    enabled: z.boolean(),
    title: z.string().trim().max(160, "Rabatt-Titel ist zu lang."),
    discountValue: z.string().trim().max(80, "Rabattwert ist zu lang."),
    startsAt: isoDateTime.nullable(),
    countdownEnd: isoDateTime.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.countdownEnd && value.countdownEnd < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["countdownEnd"],
        message: "Das Countdown-Ende liegt vor dem Aktionsstart.",
      });
    }
  });

export const PERIOD_OFFER_PHOTO_COUNT = 5;

const optionalPhotoUrl = z
  .string()
  .trim()
  .max(500, "Die Foto-Adresse ist zu lang.")
  .refine(
    (value) => value === "" || value.startsWith("/uploads/") || z.string().url().safeParse(value).success,
    "Die Foto-Adresse ist ungültig.",
  );

const offerTextFields = {
  title: z.string().trim().max(160, "Titel ist zu lang."),
  description: z.string().trim().max(2000, "Beschreibung ist zu lang."),
  price: z.string().trim().max(80, "Preis ist zu lang."),
};

export const periodOfferSchema = z
  .object({
    ...offerTextFields,
    validFrom: isoDate.nullable(),
    validUntil: isoDate.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.validFrom && value.validUntil && value.validUntil < value.validFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "Das Enddatum liegt vor dem Startdatum.",
      });
    }
  });

/**
 * Angebot der Woche. Times stay nullable so older rows without a window still load.
 * Saving requires both instants; see weeklyOfferWindowError.
 * Missing keys default to null and are not backfilled from the old date-only fields.
 */
export const weeklyOfferSchema = z
  .object({
    ...offerTextFields,
    startsAt: isoDateTime.nullable().default(null),
    endsAt: isoDateTime.nullable().default(null),
  })
  .superRefine((value, ctx) => {
    if (!value.startsAt || !value.endsAt) return;
    const start = Date.parse(value.startsAt);
    const end = Date.parse(value.endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Der Zielzeitpunkt muss nach dem Startzeitpunkt liegen.",
      });
    }
  });

export const periodOfferPhotoSchema = z.object({
  url: optionalPhotoUrl,
  // Missing on older rows. Stays empty until the merchant types a price for this slot.
  price: z.string().trim().max(80, "Preis ist zu lang.").default(""),
});

export const periodOffersSchema = z.object({
  enabled: z.boolean(),
  day: periodOfferSchema,
  week: weeklyOfferSchema,
  month: periodOfferSchema,
  photos: z
    .array(periodOfferPhotoSchema)
    .length(PERIOD_OFFER_PHOTO_COUNT, "Genau fünf Fotoplätze."),
});

export const photoItemSchema = z.object({
  id: z.string().uuid("Foto-ID ist ungültig."),
  url: z
    .string()
    .trim()
    .min(1, "Foto-Adresse fehlt.")
    .max(500)
    .refine(
      (value) => value.startsWith("/uploads/") || z.string().url().safeParse(value).success,
      "Die Foto-Adresse ist ungültig.",
    ),
});

export const photosSchema = z.object({
  enabled: z.boolean(),
  items: z.array(photoItemSchema).max(3, "Höchstens drei Fotos."),
});

export const fulfillmentModeSchema = z.enum(["pickup", "delivery", "both"]);

/**
 * Order slip. Payment stays with the merchant.
 * The four legal links are what the customer opens before the paid-order button.
 */
export const orderSlipSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(120, "Titel ist zu lang."),
  note: z.string().trim().max(1000, "Hinweis ist zu lang."),
  paymentLabel: z.string().trim().max(80, "Name des Zahlungssystems ist zu lang."),
  paymentInstructions: z.string().trim().max(1000, "Zahlungsanweisung ist zu lang."),
  paymentUrl: optionalUrl,
  fulfillment: fulfillmentModeSchema,
  pickupText: z.string().trim().max(300, "Abholhinweis ist zu lang."),
  deliveryText: z.string().trim().max(300, "Lieferhinweis ist zu lang."),
  taxNote: z.string().trim().max(200, "Steuerhinweis ist zu lang."),
  impressumUrl: optionalUrl,
  privacyUrl: optionalUrl,
  termsUrl: optionalUrl,
  withdrawalUrl: optionalUrl,
});

/** Store radius. The phone checks its own position while the app is open. The position is not stored. */
export const geofenceSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(120, "Titel ist zu lang."),
  message: z.string().trim().max(500, "Nachricht ist zu lang."),
  latitude: z.number().min(-90, "Breitengrad ist ungültig.").max(90, "Breitengrad ist ungültig."),
  longitude: z.number().min(-180, "Längengrad ist ungültig.").max(180, "Längengrad ist ungültig."),
  radiusMeters: z.number().int().min(50, "Mindestens 50 Meter.").max(2000, "Höchstens 2000 Meter."),
});

export const activeModulesSchema = z.object({
  stampCard: stampCardSchema,
  wheel: wheelSchema,
  challengePass: challengePassSchema,
  quickPoll: quickPollSchema,
  birthdayGreeting: birthdayGreetingSchema,
  seasonalGreeting: seasonalGreetingSchema,
  eventCalendar: eventCalendarSchema,
  pushCenter: pushCenterSchema,
  flashDeal: flashDealSchema,
  periodOffers: periodOffersSchema,
  photos: photosSchema,
  orderSlip: orderSlipSchema,
  geofence: geofenceSchema,
});

export const activeModulesPatchSchema = activeModulesSchema.partial();

export const designSchema = z.object({
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Farbe als Hex-Wert im Format #RRGGBB angeben."),
  logoUrl: optionalUrl,
  welcomeMessage: z.string().trim().max(2000, "Willkommensnachricht ist zu lang."),
});

export type ActiveModulesConfig = z.infer<typeof activeModulesSchema>;
export type ModuleKey = keyof ActiveModulesConfig;
export type DesignInput = z.infer<typeof designSchema>;
export type StampCardConfig = z.infer<typeof stampCardSchema>;
export type WheelConfig = z.infer<typeof wheelSchema>;
export type ChallengePassConfig = z.infer<typeof challengePassSchema>;
export type QuickPollConfig = z.infer<typeof quickPollSchema>;
export type BirthdayGreetingConfig = z.infer<typeof birthdayGreetingSchema>;
export type SeasonalGreetingConfig = z.infer<typeof seasonalGreetingSchema>;
export type EventCalendarConfig = z.infer<typeof eventCalendarSchema>;
export type CalendarEventConfig = z.infer<typeof calendarEventSchema>;
export type PushCenterConfig = z.infer<typeof pushCenterSchema>;
export type FlashDealConfig = z.infer<typeof flashDealSchema>;
export type PeriodOfferConfig = z.infer<typeof periodOfferSchema>;
export type WeeklyOfferConfig = z.infer<typeof weeklyOfferSchema>;
export type PeriodOffersConfig = z.infer<typeof periodOffersSchema>;
export type PhotosConfig = z.infer<typeof photosSchema>;
export type OrderSlipConfig = z.infer<typeof orderSlipSchema>;
export type GeofenceConfig = z.infer<typeof geofenceSchema>;
export type PhotoItem = z.infer<typeof photoItemSchema>;

export function firstSchemaMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Die Eingaben sind ungültig.";
}
