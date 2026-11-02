import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { toInputJson } from "../src/lib/modules";
import { demoActiveModules } from "../src/modules/defaults";

const prisma = new PrismaClient();

const DEMO_SLUG = "schmahl";
const DEMO_API_KEY = "demo-schmahl-key";
const DEMO_APP_NAME = "Schmahl";
const DEMO_EMAIL = "rainer.hampicke@hampacorequality.de";
const DEMO_PASSWORD = "101010";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEMO_SLUG },
    update: {
      name: "Schmahl",
      apiKey: DEMO_API_KEY,
    },
    create: {
      name: "Schmahl",
      slug: DEMO_SLUG,
      apiKey: DEMO_API_KEY,
    },
  });

  await prisma.appConfig.upsert({
    where: { tenantId: tenant.id },
    update: {
      name: DEMO_APP_NAME,
      primaryColor: "#0f766e",
      logoUrl: null,
      welcomeMessage:
        "Willkommen bei Schmahl. Hier finden Sie Aktionen, Events und Ihren persönlichen Service.",
      activeModules: toInputJson(demoActiveModules),
    },
    create: {
      tenantId: tenant.id,
      name: DEMO_APP_NAME,
      primaryColor: "#0f766e",
      logoUrl: null,
      welcomeMessage:
        "Willkommen bei Schmahl. Hier finden Sie Aktionen, Events und Ihren persönlichen Service.",
      activeModules: toInputJson(demoActiveModules),
    },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.deleteMany({
    where: {
      tenantId: tenant.id,
      NOT: { email: DEMO_EMAIL },
    },
  });
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      passwordHash,
      tenantId: tenant.id,
    },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      tenantId: tenant.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
