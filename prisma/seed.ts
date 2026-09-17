import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const login = process.env.ADMIN_LOGIN || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { login },
    update: { passwordHash },
    create: { login, passwordHash },
  });

  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.master.deleteMany();

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
        imageUrl:
          "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80",
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
        imageUrl:
          "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80",
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
        imageUrl:
          "https://images.unsplash.com/photo-1515377905703-c4788e73f6b8?w=1200&q=80",
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
        imageUrl:
          "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&q=80",
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
        imageUrl:
          "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80",
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

  console.log(
    `Seeded ${services.length} services, ${masters.length} masters, admin=${login}`,
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
