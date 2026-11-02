import {
  PERIOD_OFFER_PHOTO_COUNT,
  activeModulesSchema,
  type ActiveModulesConfig,
  type PeriodOfferConfig,
  type WeeklyOfferConfig,
} from "@/modules/schema";

const emptyPeriodOffer: PeriodOfferConfig = {
  title: "",
  description: "",
  price: "",
  validFrom: null,
  validUntil: null,
};

const emptyWeeklyOffer: WeeklyOfferConfig = {
  title: "",
  description: "",
  price: "",
  startsAt: null,
  endsAt: null,
};

function emptyPeriodOffers() {
  return {
    enabled: false,
    day: { ...emptyPeriodOffer },
    week: { ...emptyWeeklyOffer },
    month: { ...emptyPeriodOffer },
    photos: Array.from({ length: PERIOD_OFFER_PHOTO_COUNT }, () => ({ url: "", price: "" })),
  };
}

/**
 * Disabled-but-complete defaults. Seed data and the panel merge stored JSON onto this object
 * so a newly added module key does not break existing tenants.
 */
export const defaultActiveModules: ActiveModulesConfig = {
  stampCard: {
    enabled: false,
    stampCount: 10,
    rewardText: "10 % auf den nächsten Einkauf",
    redeemCode: "STEMPEL10",
  },
  wheel: {
    enabled: false,
    winProbabilityPercent: 20,
    cooldownHours: 24,
    prizes: [
      { label: "5 € Gutschein", probabilityPercent: 70 },
      { label: "10 € Gutschein", probabilityPercent: 30 },
    ],
  },
  challengePass: {
    enabled: false,
    visitTarget: 5,
    rewardText: "Gratis Getränk nach 5 Besuchen",
  },
  directFeedback: {
    enabled: false,
    question: "Wie zufrieden waren Sie mit Ihrem Besuch?",
    notifyEmail: "",
    googleReviewUrl: "",
  },
  quickPoll: {
    enabled: false,
    question: "Welche Kategorie interessiert Sie am meisten?",
    options: ["Laufschuhe", "Outdoor"],
  },
  birthdayGreeting: {
    enabled: false,
    title: "Alles Gute!",
    message:
      "Wir wünschen Ihnen einen schönen Geburtstag und freuen uns auf Ihren nächsten Besuch.",
    discountType: "percent",
    discountValue: "10",
    redemptionTerms: "Gültig ab 50 € Einkaufswert",
    validDays: 14,
    barcodeType: "QR_CODE",
  },
  seasonalGreeting: {
    enabled: false,
    bannerTitle: "Frohe Festtage",
    text: "Wir danken Ihnen für Ihre Treue in diesem Jahr.",
    imageUrl: "",
    startDate: null,
    endDate: null,
  },
  eventCalendar: {
    enabled: false,
    events: [],
  },
  pushCenter: {
    enabled: false,
    title: "",
    message: "",
    deepLink: "",
    lastQueuedAt: null,
  },
  flashDeal: {
    enabled: false,
    title: "",
    discountValue: "",
    startsAt: null,
    countdownEnd: null,
  },
  periodOffers: emptyPeriodOffers(),
  photos: {
    enabled: false,
    items: [],
  },
  orderSlip: {
    enabled: false,
    title: "Bestellzettel",
    note: "Artikel, Menge und Preis eintragen. Die Bezahlung läuft über das Zahlungssystem des Geschäfts.",
    paymentLabel: "",
    paymentInstructions: "",
    paymentUrl: "",
    fulfillment: "both",
    pickupText: "",
    deliveryText: "",
    taxNote: "Alle Preise inklusive gesetzlicher Mehrwertsteuer.",
    impressumUrl: "",
    privacyUrl: "",
    termsUrl: "",
    withdrawalUrl: "",
  },
  geofence: {
    enabled: false,
    title: "Willkommen bei LAHR",
    message: "Sie sind in der Nähe des Geschäfts. Schauen Sie sich das aktuelle Angebot an.",
    latitude: 50.3585452,
    longitude: 7.592966,
    radiusMeters: 150,
  },
};

/** Demo configuration for Schmahl. */
export const demoActiveModules: ActiveModulesConfig = activeModulesSchema.parse({
  ...defaultActiveModules,
  stampCard: {
    enabled: true,
    stampCount: 10,
    rewardText: "10 % Rabatt auf den nächsten Einkauf",
    redeemCode: "SPORT10",
  },
  wheel: {
    enabled: false,
    winProbabilityPercent: 25,
    cooldownHours: 24,
    prizes: [
      { label: "Trinkflasche", probabilityPercent: 50 },
      { label: "15 % auf Laufschuhe", probabilityPercent: 30 },
      { label: "Gratis Sportsocke", probabilityPercent: 20 },
    ],
  },
  challengePass: {
    enabled: false,
    visitTarget: 6,
    rewardText: "Nach 6 Besuchen: 20 € Gutschein",
  },
  directFeedback: {
    enabled: true,
    question: "Wie hat Ihnen der Besuch in unserem Geschäft gefallen?",
    notifyEmail: "service@schmahl.example",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJschmahl",
  },
  quickPoll: {
    enabled: false,
    question: "Welche Abteilung sollen wir als Nächstes ausbauen?",
    options: ["Laufsport", "Teamsport", "Outdoor"],
  },
  birthdayGreeting: {
    enabled: true,
    title: "Alles Gute!",
    message:
      "Das Team von Schmahl wünscht Ihnen alles Gute zum Geburtstag. Ihr persönlicher Gutschein wartet im Geschäft auf Sie.",
    discountType: "percent",
    discountValue: "15",
    redemptionTerms: "Gültig ab 50 € Einkaufswert. Nicht mit anderen Aktionen kombinierbar.",
    validDays: 30,
    barcodeType: "QR_CODE",
  },
  seasonalGreeting: {
    enabled: true,
    bannerTitle: "Frohe Weihnachten",
    text: "Vielen Dank für Ihre Treue. Wir wünschen Ihnen und Ihrer Familie friedliche Feiertage und einen guten Start ins neue Jahr.",
    imageUrl: "https://example.com/banner-weihnachten.jpg",
    startDate: "2026-11-27",
    endDate: "2026-12-31",
  },
  eventCalendar: {
    enabled: true,
    events: [
      {
        id: "3f1a0c2e-7b6d-4e1a-9c3d-2a6b8e4f1d70",
        name: "Weihnachtslauf am Rheinufer",
        date: "2026-12-06",
        location: "Rheinufer, Koblenz",
        description: "Gemeinsamer Lauf über 5 km. Start um 11:00 Uhr am Deutschen Eck.",
        rsvpEnabled: true,
      },
      {
        id: "8c2e4b1a-6d70-4f3b-8a21-5e9c1d4b7a02",
        name: "Skitour-Abend",
        date: "2026-11-12",
        location: "Schmahl",
        description: "Kurzvortrag und Ausrüstung zum Anfassen. Anmeldung im Geschäft.",
        rsvpEnabled: false,
      },
    ],
  },
  pushCenter: {
    enabled: false,
    title: "Winterschlussverkauf startet",
    message: "Sichern Sie sich ausgewählte Winterartikel, solange der Vorrat reicht.",
    deepLink: "/aktionen/winter",
    lastQueuedAt: null,
  },
  flashDeal: {
    enabled: true,
    title: "48-Stunden-Deal: Laufschuhe",
    discountValue: "25 %",
    startsAt: null,
    countdownEnd: "2026-12-01T17:00:00.000Z",
  },
  photos: {
    enabled: true,
    items: [],
  },
});
