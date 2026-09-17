import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function main() {
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      telegramBot: "https://t.me/Dr_Meedinabot?start=book",
      brand: "Dr.Meedina",
    },
    create: {
      id: "default",
      telegramBot: "https://t.me/Dr_Meedinabot?start=book",
      brand: "Dr.Meedina",
    },
  });
  console.log("SiteSettings telegramBot updated to Dr_Meedinabot");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
