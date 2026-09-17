import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

function createClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl && tursoToken) {
    return new PrismaClient({
      adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoToken }),
    });
  }
  return new PrismaClient();
}

const prisma = createClient();

const galleries = {
  face: [
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
    "https://images.unsplash.com/photo-1512290923902-8a9f81dcad34?w=1200&q=80",
  ],
  bio: [
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80",
  ],
  lips: [
    "https://images.unsplash.com/photo-1583001936908-0b8a0c0c0c0c?w=1200&q=80",
    "https://images.unsplash.com/photo-1515377905703-c4788e73f6b8?w=1200&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80",
  ],
  hyper: [
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80",
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80",
  ],
  five: [
    "https://images.unsplash.com/photo-1515377905703-c4788e73f6b8?w=1200&q=80",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&q=80",
  ],
};

async function main() {
  const login = process.env.ADMIN_LOGIN || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { login },
    update: { passwordHash },
    create: { login, passwordHash },
  });

  await prisma.botActivity.deleteMany().catch(() => undefined);
  await prisma.newsPost.deleteMany().catch(() => undefined);
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.master.deleteMany();

  await prisma.scheduleSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "Dr_Meedinabot";

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      brand: "Dr.Meedina",
      telegramBot: `https://t.me/${botUsername}?start=book`,
    },
    create: {
      id: "default",
      brand: "Dr.Meedina",
      telegramBot: `https://t.me/${botUsername}?start=book`,
      welcomeImageUrl:
        "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80",
    },
  });

  const services = await Promise.all([
    prisma.service.create({
      data: {
        nameUz: "Yuz tozalash",
        nameRu: "Чистка лица",
        nameEn: "Facial cleansing",
        descriptionUz:
          "Chuqur tozalash: poralar, yallig'lanish va teri sifati uchun yumshoq muolaja.",
        descriptionRu:
          "Глубокая чистка лица: поры, воспаления и качество кожи — бережно и аккуратно.",
        descriptionEn:
          "Deep facial cleansing for pores, inflammation control, and healthier skin texture.",
        durationMinutes: 60,
        price: 400000,
        category: "face",
        imageUrl: galleries.face[0],
        gallery: JSON.stringify(galleries.face),
      },
    }),
    prisma.service.create({
      data: {
        nameUz: "Biorevitalizatsiya",
        nameRu: "Биоревитализация",
        nameEn: "Biorevitalization",
        descriptionUz:
          "Teri namligi, elastiklik va yorqinlik uchun gialuron asosidagi muolaja (БиО).",
        descriptionRu:
          "БиО: увлажнение, упругость и сияние кожи с гиалуроновой кислотой.",
        descriptionEn:
          "Biorevitalization (Bio) with hyaluronic acid for hydration, elasticity, and glow.",
        durationMinutes: 50,
        price: 900000,
        category: "injectable",
        imageUrl: galleries.bio[0],
        gallery: JSON.stringify(galleries.bio),
      },
    }),
    prisma.service.create({
      data: {
        nameUz: "Lab konturi (Lips)",
        nameRu: "Контурная пластика губ",
        nameEn: "Lip contouring",
        descriptionUz:
          "Tabiiy shakl va hajm. Individual texnika — ortiqcha effektlarsiz.",
        descriptionRu:
          "Естественная форма и объём губ. Индивидуальная техника без «перебора».",
        descriptionEn:
          "Natural lip shape and volume with a personalized, balanced technique.",
        durationMinutes: 45,
        price: 1500000,
        category: "lips",
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80",
        gallery: JSON.stringify([
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80",
          "https://images.unsplash.com/photo-1515377905703-c4788e73f6b8?w=1200&q=80",
          "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
        ]),
      },
    }),
    prisma.service.create({
      data: {
        nameUz: "Gipergidroz davolash",
        nameRu: "Лечение гипергидроза",
        nameEn: "Hyperhidrosis treatment",
        descriptionUz:
          "Qo‘ltiq osti va boshqa zonalar uchun ortiqcha terlashni kamaytirish.",
        descriptionRu:
          "Коррекция повышенной потливости (подмышки и другие зоны) — по показаниям.",
        descriptionEn:
          "Treatment for excessive sweating (underarms and other areas) as indicated.",
        durationMinutes: 40,
        price: 1200000,
        category: "botox",
        imageUrl: galleries.hyper[0],
        gallery: JSON.stringify(galleries.hyper),
      },
    }),
    prisma.service.create({
      data: {
        nameUz: "5 nuqta texnikasi",
        nameRu: "Коррекция по технике «5 точек»",
        nameEn: "5-point technique",
        descriptionUz:
          "Yuzning muvozanati va yumshoq yoshartirish uchun aniq 5 nuqtali yondashuv.",
        descriptionRu:
          "Точечная коррекция лица по технике «5 точек» — баланс и мягкое омоложение.",
        descriptionEn:
          "Precise 5-point facial correction for balance and gentle rejuvenation.",
        durationMinutes: 40,
        price: 1100000,
        category: "injectable",
        imageUrl: galleries.five[0],
        gallery: JSON.stringify(galleries.five),
      },
    }),
  ]);

  const masters = await Promise.all([
    prisma.master.create({
      data: {
        name: "Мадина",
        photoUrl:
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&q=80",
        specializationUz: "Shifokor-kosmetolog",
        specializationRu: "Врач-косметолог",
        specializationEn: "Cosmetologist MD",
        bioUz:
          "Tibbiy ma'lumotli kosmetolog. Toza teri, tabiiy natija va individual yondashuv — asosiy tamoyillar. Qabul: Toshkent.",
        bioRu:
          "Косметолог с медицинским образованием. Чистая кожа, естественный результат и индивидуальный подход каждому. Приём в Ташкенте.",
        bioEn:
          "Cosmetologist with medical education. Clear skin, natural results, and a personalized approach. Appointments in Tashkent.",
      },
    }),
  ]);

  const target =
    process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
      ? "Turso"
      : "local SQLite";
  console.log(
    `Seeded ${services.length} services, ${masters.length} masters, admin=${login} → ${target}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
