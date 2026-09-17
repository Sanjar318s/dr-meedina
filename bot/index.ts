import { Bot, InlineKeyboard, Keyboard, session } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { format, addDays } from "date-fns";
import { prisma } from "../lib/prisma";
import { createBooking, getAvailableSlots, cancelBooking } from "../lib/booking/slots";
import { notifyAdmin } from "../lib/telegram";
import { getSiteSettings } from "../lib/site-settings";
import { isAdmin, touchBotUser } from "../lib/bot-users";
import { broadcastNews } from "../lib/bot-broadcast";

type Lang = "uz" | "ru" | "en";

type SessionData = {
  lang: Lang;
  step?: string;
  serviceId?: string;
  masterId?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  adminNewsDraft?: string;
  adminPriceServiceId?: string;
};

type BotContext = Context & SessionFlavor<SessionData>;

const T = {
  uz: {
    welcome: "<b>Dr.Meedina</b>\nToza teri — sizning ishonchingiz.\n\nQuyidagi menyudan tanlang:",
    book: "📅 Yozilish",
    my: "📋 Mening yozuvlarim",
    news: "📰 Yangiliklar",
    lang: "🌐 Til",
    admin: "🛠 Admin",
    chooseService: "Xizmatni tanlang:",
    chooseMaster: "Shifokorni tanlang:",
    chooseDate: "Sanani tanlang:",
    chooseTime: "Vaqtni tanlang:",
    sendName: "Ismingizni yuboring:",
    sendPhone: "Telefon raqamingizni yuboring (+998…):",
    confirm: "Tasdiqlaysizmi?",
    yes: "✅ Ha",
    no: "❌ Yo‘q",
    done: "Yozilish qabul qilindi!",
    noBookings: "Faol yozuvlar yo‘q.",
    cancelled: "Yozuv bekor qilindi.",
    unsub: "Yangiliklardan voz kechish",
    sub: "Yangiliklarga obuna",
    adminBookings: "📋 Yozuvlar",
    adminPrices: "💰 Narxlar",
    adminNews: "📢 Yangilik yuborish",
    adminStats: "📊 Statistika",
    back: "◀️ Orqaga",
  },
  ru: {
    welcome: "<b>Dr.Meedina</b>\nЧистая кожа — твоя уверенность.\n\nВыберите пункт меню:",
    book: "📅 Запись",
    my: "📋 Мои записи",
    news: "📰 Новости",
    lang: "🌐 Язык",
    admin: "🛠 Админ",
    chooseService: "Выберите услугу:",
    chooseMaster: "Выберите врача:",
    chooseDate: "Выберите дату:",
    chooseTime: "Выберите время:",
    sendName: "Отправьте ваше имя:",
    sendPhone: "Отправьте номер телефона (+998…):",
    confirm: "Подтвердить запись?",
    yes: "✅ Да",
    no: "❌ Нет",
    done: "Запись принята!",
    noBookings: "Активных записей нет.",
    cancelled: "Запись отменена.",
    unsub: "Отписаться от новостей",
    sub: "Подписаться на новости",
    adminBookings: "📋 Записи",
    adminPrices: "💰 Цены",
    adminNews: "📢 Новая новость",
    adminStats: "📊 Статистика",
    back: "◀️ Назад",
  },
  en: {
    welcome: "<b>Dr.Meedina</b>\nClear skin is your confidence.\n\nChoose from the menu:",
    book: "📅 Book",
    my: "📋 My bookings",
    news: "📰 News",
    lang: "🌐 Language",
    admin: "🛠 Admin",
    chooseService: "Choose a service:",
    chooseMaster: "Choose a doctor:",
    chooseDate: "Choose a date:",
    chooseTime: "Choose a time:",
    sendName: "Send your name:",
    sendPhone: "Send your phone (+998…):",
    confirm: "Confirm booking?",
    yes: "✅ Yes",
    no: "❌ No",
    done: "Booking received!",
    noBookings: "No active bookings.",
    cancelled: "Booking cancelled.",
    unsub: "Unsubscribe from news",
    sub: "Subscribe to news",
    adminBookings: "📋 Bookings",
    adminPrices: "💰 Prices",
    adminNews: "📢 New post",
    adminStats: "📊 Stats",
    back: "◀️ Back",
  },
} as const;

function detectLang(code?: string): Lang {
  if (!code) return "ru";
  if (code.startsWith("uz")) return "uz";
  if (code.startsWith("en")) return "en";
  return "ru";
}

function serviceName(s: { nameUz: string; nameRu: string; nameEn: string }, lang: Lang) {
  if (lang === "uz") return s.nameUz;
  if (lang === "en") return s.nameEn;
  return s.nameRu;
}

function mainKeyboard(lang: Lang, admin: boolean) {
  const t = T[lang];
  const kb = new Keyboard()
    .text(t.book)
    .text(t.my)
    .row()
    .text(t.news)
    .text(t.lang);
  if (admin) kb.row().text(t.admin);
  return kb.resized().persistent();
}

function adminKeyboard(lang: Lang) {
  const t = T[lang];
  return new Keyboard()
    .text(t.adminBookings)
    .text(t.adminPrices)
    .row()
    .text(t.adminNews)
    .text(t.adminStats)
    .row()
    .text(t.back)
    .resized();
}

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");

  const bot = new Bot<BotContext>(token);
  bot.use(session({ initial: (): SessionData => ({ lang: "ru" }) }));

  async function greet(ctx: BotContext) {
    if (!ctx.from) return;
    const admin = isAdmin(ctx.from.id);
    ctx.session.lang = detectLang(ctx.from.language_code);
    await touchBotUser(ctx.from, "start");
    const t = T[ctx.session.lang];
    const settings = await getSiteSettings();
    const caption = t.welcome.replace("Dr.Meedina", settings.brand);
    const kb = mainKeyboard(ctx.session.lang, admin);
    try {
      await ctx.replyWithPhoto(settings.welcomeImageUrl, {
        caption,
        parse_mode: "HTML",
        reply_markup: kb,
      });
    } catch {
      await ctx.reply(caption, { parse_mode: "HTML", reply_markup: kb });
    }
  }

  bot.command("start", greet);

  bot.on("message:text", async (ctx) => {
    if (!ctx.from) return;
    const text = ctx.message.text.trim();
    const lang = ctx.session.lang || detectLang(ctx.from.language_code);
    ctx.session.lang = lang;
    const t = T[lang];
    const admin = isAdmin(ctx.from.id);
    await touchBotUser(ctx.from);

    if (text === t.back) {
      ctx.session.step = undefined;
      await ctx.reply(t.welcome, { parse_mode: "HTML", reply_markup: mainKeyboard(lang, admin) });
      return;
    }

    if (text === t.lang) {
      const kb = new InlineKeyboard().text("UZ", "lang:uz").text("RU", "lang:ru").text("EN", "lang:en");
      await ctx.reply("Language / Til / Язык", { reply_markup: kb });
      return;
    }

    if (text === t.book || text === "/book") {
      await startBook(ctx);
      return;
    }

    if (text === t.my) {
      await showMy(ctx);
      return;
    }

    if (text === t.news) {
      await showNews(ctx);
      return;
    }

    if (admin && text === t.admin) {
      await ctx.reply("Admin menu", { reply_markup: adminKeyboard(lang) });
      return;
    }

    if (admin && text === t.adminBookings) {
      await adminBookings(ctx);
      return;
    }

    if (admin && text === t.adminPrices) {
      await adminPrices(ctx);
      return;
    }

    if (admin && text === t.adminNews) {
      ctx.session.step = "admin_news";
      await ctx.reply("Отправьте текст новости:");
      return;
    }

    if (admin && text === t.adminStats) {
      await adminStats(ctx);
      return;
    }

    if (ctx.session.step === "admin_news" && admin) {
      const post = await prisma.newsPost.create({
        data: { text, createdBy: String(ctx.from.id) },
      });
      const result = await broadcastNews(post.id);
      ctx.session.step = undefined;
      await ctx.reply(`Новость отправлена: ${result.sent} пользователей`);
      return;
    }

    if (ctx.session.step === "admin_price" && admin && ctx.session.adminPriceServiceId) {
      const price = Number(text.replace(/\s/g, ""));
      if (!Number.isFinite(price) || price < 0) {
        await ctx.reply("Введите число (цена)");
        return;
      }
      await prisma.service.update({
        where: { id: ctx.session.adminPriceServiceId },
        data: { price },
      });
      ctx.session.step = undefined;
      ctx.session.adminPriceServiceId = undefined;
      await ctx.reply(`Цена обновлена: ${price.toLocaleString()}`);
      return;
    }

    if (ctx.session.step === "name") {
      ctx.session.name = text;
      ctx.session.step = "phone";
      await ctx.reply(t.sendPhone);
      return;
    }

    if (ctx.session.step === "phone") {
      ctx.session.phone = text;
      ctx.session.step = "confirm";
      const service = await prisma.service.findUnique({ where: { id: ctx.session.serviceId } });
      const master = await prisma.master.findUnique({ where: { id: ctx.session.masterId } });
      const kb = new InlineKeyboard().text(t.yes, "confirm:yes").text(t.no, "confirm:no");
      await ctx.reply(
        `${t.confirm}\n${service ? serviceName(service, lang) : ""}\n${master?.name}\n${ctx.session.date} ${ctx.session.time}\n${ctx.session.name} · ${ctx.session.phone}`,
        { reply_markup: kb },
      );
      return;
    }
  });

  bot.callbackQuery(/^lang:(uz|ru|en)$/, async (ctx) => {
    const lang = ctx.match![1] as Lang;
    ctx.session.lang = lang;
    if (ctx.from) {
      await prisma.botUser.updateMany({
        where: { telegramId: String(ctx.from.id) },
        data: { lang },
      });
    }
    await ctx.answerCallbackQuery();
    await ctx.reply(T[lang].welcome, {
      parse_mode: "HTML",
      reply_markup: mainKeyboard(lang, isAdmin(ctx.from?.id)),
    });
  });

  bot.callbackQuery(/^svc:(.+)$/, async (ctx) => {
    ctx.session.serviceId = ctx.match![1];
    await ctx.answerCallbackQuery();
    const masters = await prisma.master.findMany({ where: { isActive: true } });
    if (masters.length === 1) {
      ctx.session.masterId = masters[0].id;
      await askDates(ctx);
      return;
    }
    const lang = ctx.session.lang;
    const kb = new InlineKeyboard();
    masters.forEach((m) => kb.text(m.name, `mst:${m.id}`).row());
    ctx.session.step = "master";
    await ctx.reply(T[lang].chooseMaster, { reply_markup: kb });
  });

  bot.callbackQuery(/^mst:(.+)$/, async (ctx) => {
    ctx.session.masterId = ctx.match![1];
    await ctx.answerCallbackQuery();
    await askDates(ctx);
  });

  bot.callbackQuery(/^date:(.+)$/, async (ctx) => {
    ctx.session.date = ctx.match![1];
    await ctx.answerCallbackQuery();
    const slots = await getAvailableSlots({
      masterId: ctx.session.masterId!,
      date: ctx.session.date,
      serviceId: ctx.session.serviceId!,
    });
    const lang = ctx.session.lang;
    if (!slots.length) {
      await ctx.reply(T[lang].chooseTime + " — пусто");
      return;
    }
    const kb = new InlineKeyboard();
    slots.forEach((s, i) => {
      kb.text(s, `time:${s}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    ctx.session.step = "time";
    await ctx.reply(T[lang].chooseTime, { reply_markup: kb });
  });

  bot.callbackQuery(/^time:(.+)$/, async (ctx) => {
    ctx.session.time = ctx.match![1];
    ctx.session.step = "name";
    await ctx.answerCallbackQuery();
    await ctx.reply(T[ctx.session.lang].sendName);
  });

  bot.callbackQuery(/^confirm:(yes|no)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.match![1] === "no") {
      ctx.session.step = undefined;
      await ctx.reply(T[ctx.session.lang].cancelled);
      return;
    }
    try {
      const booking = await createBooking({
        clientName: ctx.session.name!,
        clientPhone: ctx.session.phone!,
        clientTelegramId: String(ctx.from!.id),
        serviceId: ctx.session.serviceId!,
        masterId: ctx.session.masterId!,
        date: ctx.session.date!,
        time: ctx.session.time!,
        source: "BOT",
      });
      await touchBotUser(ctx.from!, "book", { bookingId: booking.id });
      await notifyAdmin(
        `Новая запись (BOT)\n${ctx.session.name} ${ctx.session.phone}\n${ctx.session.date} ${ctx.session.time}`,
      );
      ctx.session.step = undefined;
      await ctx.reply(T[ctx.session.lang].done);
    } catch {
      await ctx.reply(T[ctx.session.lang].chooseTime + " — ошибка, выберите другое время");
    }
  });

  bot.callbackQuery(/^cancel:(.+)$/, async (ctx) => {
    await cancelBooking(ctx.match![1]);
    await touchBotUser(ctx.from!, "cancel");
    await ctx.answerCallbackQuery();
    await ctx.reply(T[ctx.session.lang].cancelled);
  });

  bot.callbackQuery(/^price:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.adminPriceServiceId = ctx.match![1];
    ctx.session.step = "admin_price";
    await ctx.answerCallbackQuery();
    await ctx.reply("Введите новую цену (число):");
  });

  bot.callbackQuery(/^bstatus:(.+):(CONFIRMED|CANCELLED)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    const [, id, status] = ctx.match!;
    await prisma.booking.update({
      where: { id },
      data: { status: status as "CONFIRMED" | "CANCELLED" },
    });
    await ctx.answerCallbackQuery({ text: status });
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });
  });

  bot.callbackQuery("news:toggle", async (ctx) => {
    if (!ctx.from) return;
    const user = await prisma.botUser.findUnique({ where: { telegramId: String(ctx.from.id) } });
    if (!user) return;
    const next = !user.subscribedNews;
    await prisma.botUser.update({ where: { id: user.id }, data: { subscribedNews: next } });
    await ctx.answerCallbackQuery();
    await ctx.reply(next ? T[ctx.session.lang].sub : T[ctx.session.lang].unsub);
  });

  async function startBook(ctx: BotContext) {
    const lang = ctx.session.lang;
    const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
    const kb = new InlineKeyboard();
    services.forEach((s) => {
      kb.text(`${serviceName(s, lang)} — ${s.price.toLocaleString()}`, `svc:${s.id}`).row();
    });
    ctx.session.step = "service";
    await touchBotUser(ctx.from!, "book_start");
    await ctx.reply(T[lang].chooseService, { reply_markup: kb });
  }

  async function askDates(ctx: BotContext) {
    const lang = ctx.session.lang;
    const kb = new InlineKeyboard();
    for (let i = 0; i < 7; i++) {
      const d = addDays(new Date(), i);
      const key = format(d, "yyyy-MM-dd");
      kb.text(format(d, "dd.MM"), `date:${key}`);
      if ((i + 1) % 4 === 0) kb.row();
    }
    ctx.session.step = "date";
    await ctx.reply(T[lang].chooseDate, { reply_markup: kb });
  }

  async function showMy(ctx: BotContext) {
    const bookings = await prisma.booking.findMany({
      where: {
        clientTelegramId: String(ctx.from!.id),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { service: true, master: true },
      orderBy: { startsAt: "asc" },
      take: 5,
    });
    if (!bookings.length) {
      await ctx.reply(T[ctx.session.lang].noBookings);
      return;
    }
    for (const b of bookings) {
      const kb = new InlineKeyboard().text(T[ctx.session.lang].cancelled, `cancel:${b.id}`);
      await ctx.reply(
        `${format(b.startsAt, "dd.MM.yyyy HH:mm")}\n${serviceName(b.service, ctx.session.lang)}\n${b.master.name}\n${b.status}`,
        { reply_markup: kb },
      );
    }
  }

  async function showNews(ctx: BotContext) {
    await touchBotUser(ctx.from!, "news_open");
    const posts = await prisma.newsPost.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
    const kb = new InlineKeyboard().text(
      T[ctx.session.lang].unsub + " / " + T[ctx.session.lang].sub,
      "news:toggle",
    );
    if (!posts.length) {
      await ctx.reply("—", { reply_markup: kb });
      return;
    }
    for (const p of posts) {
      await ctx.reply(`📰 ${format(p.createdAt, "dd.MM")}\n${p.text}`);
    }
    await ctx.reply("…", { reply_markup: kb });
  }

  async function adminBookings(ctx: BotContext) {
    const list = await prisma.booking.findMany({
      where: { status: "PENDING" },
      include: { service: true, master: true },
      orderBy: { startsAt: "asc" },
      take: 10,
    });
    if (!list.length) {
      await ctx.reply("Нет PENDING записей");
      return;
    }
    for (const b of list) {
      const kb = new InlineKeyboard()
        .text("✅", `bstatus:${b.id}:CONFIRMED`)
        .text("❌", `bstatus:${b.id}:CANCELLED`);
      await ctx.reply(
        `${format(b.startsAt, "dd.MM HH:mm")} · ${b.clientName}\n${b.service.nameRu} · ${b.master.name}`,
        { reply_markup: kb },
      );
    }
  }

  async function adminPrices(ctx: BotContext) {
    const services = await prisma.service.findMany({ orderBy: { nameRu: "asc" } });
    const kb = new InlineKeyboard();
    services.forEach((s) => {
      kb.text(`${s.nameRu}: ${s.price.toLocaleString()}`, `price:${s.id}`).row();
    });
    await ctx.reply("Выберите услугу для смены цены:", { reply_markup: kb });
  }

  async function adminStats(ctx: BotContext) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, active, acts] = await Promise.all([
      prisma.botUser.count(),
      prisma.botUser.count({ where: { lastSeenAt: { gte: weekAgo } } }),
      prisma.botActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: true },
      }),
    ]);
    const lines = acts
      .map(
        (a) =>
          `${format(a.createdAt, "dd.MM HH:mm")} · ${a.user.username || a.user.telegramId} · ${a.action}`,
      )
      .join("\n");
    await ctx.reply(`👥 Всего: ${total}\n🔥 Активны 7д: ${active}\n\n${lines || "—"}`);
  }

  return bot;
}
