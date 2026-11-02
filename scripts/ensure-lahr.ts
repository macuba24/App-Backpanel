import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { toInputJson } from "../src/lib/modules";
import { defaultActiveModules } from "../src/modules/defaults";
import type { FactoryConfig } from "../src/modules/factory";

const prisma = new PrismaClient();

const SLUG = "lahr";
const EMAIL = "lahr@schuh-frank.de";
const PASSWORD = "101010";

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
  homepage: {
    enabled: true,
    label: "Homepage",
    url: "https://www.schuh-frank.de/",
  },
};

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const tenant = await prisma.tenant.upsert({
    where: { slug: SLUG },
    update: { name: "LAHR SCHUHE" },
    create: {
      name: "LAHR SCHUHE",
      slug: SLUG,
      apiKey: "lahr-schuhe-key",
    },
  });

  const modules = toInputJson(defaultActiveModules);
  const factoryJson = JSON.parse(JSON.stringify(factory));
  const config = await prisma.appConfig.findUnique({ where: { tenantId: tenant.id } });
  if (!config) {
    await prisma.appConfig.create({
      data: {
        tenantId: tenant.id,
        name: "LAHR",
        primaryColor: "#71abd9",
        logoUrl: null,
        welcomeMessage: "Willkommen bei LAHR SCHUHE.",
        activeModules: modules,
        factory: factoryJson,
      },
    });
  } else if (config.factory == null) {
    await prisma.appConfig.update({
      where: { tenantId: tenant.id },
      data: { factory: factoryJson, primaryColor: "#71abd9", name: "LAHR" },
    });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existingUser && existingUser.tenantId !== tenant.id) {
    throw new Error("Die Lahr-Anmeldung gehört schon zu einem anderen Zugang.");
  }
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { tenantId: tenant.id },
    create: {
      email: EMAIL,
      passwordHash,
      tenantId: tenant.id,
    },
  });

  console.log("lahr tenant ready");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : "lahr tenant failed");
    await prisma.$disconnect();
    process.exit(1);
  });
