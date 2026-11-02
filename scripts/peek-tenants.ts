import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { slug: true, name: true } });
  const users = await prisma.user.findMany({
    select: { email: true, tenant: { select: { slug: true } } },
  });
  console.log(tenants.map((row) => `${row.slug} ${row.name}`).join(" | "));
  console.log(users.map((row) => `${row.email} -> ${row.tenant.slug}`).join(" | "));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "query failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
