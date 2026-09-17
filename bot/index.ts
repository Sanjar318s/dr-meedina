import { Bot, InlineKeyboard, Keyboard, session } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { format, addDays } from "date-fns";
import { prisma } from "../lib/prisma";
import { createBooking, getAvailableSlots, cancelBooking } from "../lib/booking/slots";
import { notifyAdminNewBooking, formatQrStatusAlert, refreshBookingTelegramCard, clearBookingTelegramCard } from "../lib/telegram";
import { getSiteSettings } from "../lib/site-settings";
import { getScheduleSettings, isWorkingDay } from "../lib/schedule";
import { isAdmin, touchBotUser } from "../lib/bot-users";
import { broadcastNews } from "../lib/bot-broadcast";
import { sendScreen, sendFreshScreen, clearScreen } from "../lib/bot-ui";

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
  adminPriceServiceId?: string;
  newsPhotos?: string[];
  newsText?: string;
  tickerDraft?: string;
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
    adminNews: "📰 Yangiliklar",
    adminStats: "📊 Statistika",
    back: "◀️ Orqaga",
    dayOff: "Dam olish kuni",
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
    adminNews: "📰 Новости",
    adminStats: "📊 Статистика",
    back: "◀️ Назад",
    dayOff: "Выходной",
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
    adminNews: "📰 News",
    adminStats: "📊 Stats",
    back: "◀️ Back",
    dayOff: "Day off",
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
  const kb = new Keyboard().text(t.book).text(t.my).row().text(t.news).text(t.lang);
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

async function translateSimple(text: string, from: Lang): Promise<{ uz: string; ru: string; en: string }> {
  const map: Record<Lang, string> = { ru: "ru", uz: "uz", en: "en" };
  const targets = (["ru", "uz", "en"] as Lang[]).filter((l) => l !== from);
  const out: Record<string, string> = { [from]: text };
  for (const to of targets) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${map[from]}|${map[to]}`;
      const res = await fetch(url);
      const data = await res.json();
      out[to] = data?.responseData?.translatedText || text;
    } catch {
      out[to] = text;
    }
  }
  return { uz: out.uz || text, ru: out.ru || text, en: out.en || text };
}

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");

  const bot = new Bot<BotContext>(token);
  bot.use(session({ initial: (): SessionData => ({ lang: "ru", newsPhotos: [] }) }));

  async function greet(ctx: BotContext) {
    if (!ctx.from || !ctx.chat) return;
    const admin = isAdmin(ctx.from.id);
    ctx.session.lang = detectLang(ctx.from.language_code);
    await touchBotUser(ctx.from, "start");
    const t = T[ctx.session.lang];
    const settings = await getSiteSettings();
    const caption = t.welcome.replace("Dr.Meedina", settings.brand);
    const kb = mainKeyboard(ctx.session.lang, admin);
    await clearScreen(ctx);
    let msgId: number | undefined;
    try {
      const photo = await ctx.replyWithPhoto(settings.welcomeImageUrl, {
        caption,
        parse_mode: "HTML",
        reply_markup: kb,
      });
      msgId = photo.message_id;
    } catch {
      const msg = await ctx.reply(caption, { parse_mode: "HTML", reply_markup: kb });
      msgId = msg.message_id;
    }
    if (msgId) {
      await prisma.botUser.updateMany({
        where: { telegramId: String(ctx.from.id) },
        data: { tgUiMsgId: msgId },
      });
    }
  }

  bot.command("start", greet);

  bot.on("message:photo", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;
    if (ctx.session.step !== "admin_news_photo") return;
    const photos = ctx.message.photo;
    const best = photos[photos.length - 1];
    // Store Telegram file_id (works for broadcast without public URL)
    ctx.session.newsPhotos = [...(ctx.session.newsPhotos || []), best.file_id];
    const kb = new InlineKeyboard()
      .text("Готово →", "anews:photos_done")
      .text("Без фото", "anews:no_photo");
    await ctx.reply(`Фото добавлено (${ctx.session.newsPhotos.length}). Ещё или далее?`, {
      reply_markup: kb,
    });
  });

  bot.on("message:text", async (ctx) => {
    try {
    if (!ctx.from) return;
    const text = ctx.message.text.trim();
    const lang = ctx.session.lang || detectLang(ctx.from.language_code);
    ctx.session.lang = lang;
    const t = T[lang];
    const admin = isAdmin(ctx.from.id);
    await touchBotUser(ctx.from);

    if (text === t.back) {
      ctx.session.step = undefined;
      await sendFreshScreen(ctx, t.welcome, {
        parse_mode: "HTML",
        reply_markup: mainKeyboard(lang, admin),
      });
      return;
    }

    if (text === t.lang) {
      const kb = new InlineKeyboard().text("UZ", "lang:uz").text("RU", "lang:ru").text("EN", "lang:en");
      await sendScreen(ctx, "Language / Til / Язык", { reply_markup: kb });
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
      await sendFreshScreen(ctx, "🛠 <b>Админ-меню</b>\nВыберите раздел:", {
        parse_mode: "HTML",
        reply_markup: adminKeyboard(lang),
      });
      return;
    }

    if (admin && (text === t.adminBookings || text === "📋 Записи" || text === "Записи")) {
      await adminBookings(ctx);
      return;
    }

    if (admin && text === t.adminPrices) {
      await adminPrices(ctx);
      return;
    }

    if (admin && text === t.adminNews) {
      const kb = new InlineKeyboard()
        .text("📢 Рассылка", "anews:broadcast")
        .row()
        .text("✨ Строка на сайт", "anews:ticker")
        .row()
        .text("📋 Список", "anews:list");
      await sendScreen(ctx, "📰 <b>Новости</b>\nЧто сделаем?", { parse_mode: "HTML", reply_markup: kb });
      return;
    }

    if (admin && text === t.adminStats) {
      await adminStats(ctx);
      return;
    }

    if (ctx.session.step === "admin_news_text" && admin) {
      ctx.session.newsText = text;
      ctx.session.step = "admin_news_confirm";
      const kb = new InlineKeyboard().text("✅ Отправить", "anews:send").text("❌ Отмена", "anews:cancel");
      const n = ctx.session.newsPhotos?.length || 0;
      await ctx.reply(`Превью:\n${n ? `📷 ${n} фото\n` : ""}${text}\n\nОтправить всем?`, {
        reply_markup: kb,
      });
      return;
    }

    if (ctx.session.step === "admin_ticker" && admin) {
      const texts = await translateSimple(text.slice(0, 80), "ru");
      await prisma.tickerItem.create({
        data: { textUz: texts.uz, textRu: texts.ru, textEn: texts.en, isActive: true },
      });
      ctx.session.step = undefined;
      await ctx.reply("✨ Добавлено на сайт (дорожка новостей)");
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
      await sendScreen(ctx, t.sendPhone);
      return;
    }

    if (ctx.session.step === "phone") {
      ctx.session.phone = text;
      ctx.session.step = "confirm";
      const service = await prisma.service.findUnique({ where: { id: ctx.session.serviceId } });
      const master = await prisma.master.findUnique({ where: { id: ctx.session.masterId } });
      const kb = new InlineKeyboard().text(t.yes, "confirm:yes").text(t.no, "confirm:no");
      await sendScreen(
        ctx,
        `${t.confirm}\n${service ? serviceName(service, lang) : ""}\n${master?.name}\n${ctx.session.date} ${ctx.session.time}\n${ctx.session.name} · ${ctx.session.phone}`,
        { reply_markup: kb },
      );
      return;
    }
    } catch (e) {
      console.error("bot message:text error", e);
      try {
        await ctx.reply("Произошла ошибка. Нажмите /start");
      } catch {
        /* ignore */
      }
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
    await sendFreshScreen(ctx, T[lang].welcome, {
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
    await sendScreen(ctx, T[lang].chooseMaster, { reply_markup: kb });
  });

  bot.callbackQuery(/^mst:(.+)$/, async (ctx) => {
    ctx.session.masterId = ctx.match![1];
    await ctx.answerCallbackQuery();
    await askDates(ctx);
  });

  bot.callbackQuery(/^date:(.+)$/, async (ctx) => {
    ctx.session.date = ctx.match![1];
    await ctx.answerCallbackQuery();
    const schedule = await getScheduleSettings();
    if (!isWorkingDay(ctx.session.date, schedule)) {
      await sendScreen(ctx, T[ctx.session.lang].dayOff);
      return;
    }
    const slots = await getAvailableSlots({
      masterId: ctx.session.masterId!,
      date: ctx.session.date,
      serviceId: ctx.session.serviceId!,
    });
    const lang = ctx.session.lang;
    if (!slots.length) {
      await sendScreen(ctx, T[lang].chooseTime + " — пусто");
      return;
    }
    const kb = new InlineKeyboard();
    slots.forEach((s, i) => {
      kb.text(s, `time:${s}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    ctx.session.step = "time";
    await sendScreen(ctx, T[lang].chooseTime, { reply_markup: kb });
  });

  bot.callbackQuery(/^time:(.+)$/, async (ctx) => {
    ctx.session.time = ctx.match![1];
    ctx.session.step = "name";
    await ctx.answerCallbackQuery();
    await sendScreen(ctx, T[ctx.session.lang].sendName);
  });

  bot.callbackQuery(/^confirm:(yes|no)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.match![1] === "no") {
      ctx.session.step = undefined;
      await sendScreen(ctx, T[ctx.session.lang].cancelled);
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
      await notifyAdminNewBooking(booking);
      ctx.session.step = undefined;
      await sendScreen(ctx, T[ctx.session.lang].done, {
        reply_markup: mainKeyboard(ctx.session.lang, isAdmin(ctx.from?.id)),
      });
    } catch {
      await sendScreen(ctx, T[ctx.session.lang].chooseTime + " — ошибка, выберите другое время");
    }
  });

  bot.callbackQuery(/^cancel:(.+)$/, async (ctx) => {
    await cancelBooking(ctx.match![1]);
    await touchBotUser(ctx.from!, "cancel");
    await ctx.answerCallbackQuery();
    await showMy(ctx);
  });

  bot.callbackQuery(/^price:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.adminPriceServiceId = ctx.match![1];
    ctx.session.step = "admin_price";
    await ctx.answerCallbackQuery();
    await sendScreen(ctx, "Введите новую цену (число):");
  });

  bot.callbackQuery(/^bstatus:(.+):(CONFIRMED|CANCELLED)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.answerCallbackQuery({ text: "Нет доступа", show_alert: true });
      return;
    }
    const [, id, status] = ctx.match!;
    try {
      await prisma.booking.update({
        where: { id },
        data: { status: status as "CONFIRMED" | "CANCELLED" },
      });
      await ctx.answerCallbackQuery({
        text: status === "CONFIRMED" ? "Принята ✓" : "Отклонена",
        show_alert: true,
      });
      await clearBookingTelegramCard(id);
      await adminBookings(ctx);
    } catch (e) {
      console.error("bstatus failed", e);
      await ctx.answerCallbackQuery({ text: "Ошибка сохранения", show_alert: true });
    }
  });

  bot.callbackQuery(/^bcheckin:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.answerCallbackQuery({ text: "Нет доступа", show_alert: true });
      return;
    }
    const id = ctx.match![1];
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      await ctx.answerCallbackQuery({ text: "Не найдено", show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery({
      text: formatQrStatusAlert(booking),
      show_alert: true,
    });
    if (booking.status === "SERVED") {
      await clearBookingTelegramCard(id);
      await adminBookings(ctx);
    } else {
      await refreshBookingTelegramCard(id);
    }
  });

  bot.callbackQuery(/^bforget:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.answerCallbackQuery({ text: "Нет доступа", show_alert: true });
      return;
    }
    const id = ctx.match![1];
    await prisma.booking.update({
      where: { id },
      data: { tgHidden: true },
    });
    await ctx.answerCallbackQuery({ text: "Скрыто" });
    await clearBookingTelegramCard(id);
    await adminBookings(ctx);
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

  bot.callbackQuery("anews:broadcast", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.step = "admin_news_photo";
    ctx.session.newsPhotos = [];
    ctx.session.newsText = undefined;
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard().text("Без фото", "anews:no_photo");
    await ctx.reply("📷 Пришлите фото для рассылки (можно несколько), или «Без фото»", {
      reply_markup: kb,
    });
  });

  bot.callbackQuery("anews:no_photo", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.newsPhotos = [];
    ctx.session.step = "admin_news_text";
    await ctx.answerCallbackQuery();
    await ctx.reply("✍️ Напишите текст рассылки (подпись):");
  });

  bot.callbackQuery("anews:photos_done", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.step = "admin_news_text";
    await ctx.answerCallbackQuery();
    await ctx.reply("✍️ Напишите текст рассылки (подпись к фото):");
  });

  bot.callbackQuery("anews:send", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    await ctx.answerCallbackQuery();
    const photos = ctx.session.newsPhotos || [];
    const text = ctx.session.newsText || "";
    const post = await prisma.newsPost.create({
      data: {
        text,
        imageUrl: photos[0] || null,
        imageUrls: photos.length ? JSON.stringify(photos) : null,
        createdBy: String(ctx.from!.id),
      },
    });
    const result = await broadcastNews(post.id);
    ctx.session.step = undefined;
    ctx.session.newsPhotos = [];
    ctx.session.newsText = undefined;
    await ctx.reply(`✅ Отправлено ${result.sent} подписчикам`);
  });

  bot.callbackQuery("anews:cancel", async (ctx) => {
    ctx.session.step = undefined;
    ctx.session.newsPhotos = [];
    await ctx.answerCallbackQuery();
    await ctx.reply("Отменено");
  });

  bot.callbackQuery("anews:ticker", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    ctx.session.step = "admin_ticker";
    await ctx.answerCallbackQuery();
    await ctx.reply("✨ Пришлите короткий текст для дорожки на сайте (до ~80 символов):");
  });

  bot.callbackQuery("anews:list", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    await ctx.answerCallbackQuery();
    const [posts, ticks] = await Promise.all([
      prisma.newsPost.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.tickerItem.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    let msg = "<b>Рассылки:</b>\n";
    msg +=
      posts.map((p) => `• ${format(p.createdAt, "dd.MM")} ${p.broadcast ? "✅" : "·"} ${p.text.slice(0, 40)}`).join("\n") ||
      "—";
    msg += "\n\n<b>Дорожка:</b>\n";
    msg += ticks.map((t) => `• ${t.isActive ? "🟢" : "⚪"} ${t.textRu}`).join("\n") || "—";
    await ctx.reply(msg, { parse_mode: "HTML" });
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
    await sendFreshScreen(ctx, T[lang].chooseService, { reply_markup: kb });
  }

  async function askDates(ctx: BotContext) {
    const lang = ctx.session.lang;
    const schedule = await getScheduleSettings();
    const kb = new InlineKeyboard();
    let shown = 0;
    for (let i = 0; i < 21 && shown < 10; i++) {
      const d = addDays(new Date(), i);
      const key = format(d, "yyyy-MM-dd");
      if (!isWorkingDay(key, schedule)) continue;
      kb.text(format(d, "dd.MM"), `date:${key}`);
      shown += 1;
      if (shown % 4 === 0) kb.row();
    }
    ctx.session.step = "date";
    await sendScreen(ctx, T[lang].chooseDate, { reply_markup: kb });
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
      await sendScreen(ctx, T[ctx.session.lang].noBookings);
      return;
    }
    let text = `<b>${T[ctx.session.lang].my}</b>\n\n`;
    const kb = new InlineKeyboard();
    for (const b of bookings) {
      text += `${format(b.startsAt, "dd.MM.yyyy HH:mm")}\n${serviceName(b.service, ctx.session.lang)} · ${b.master.name}\n${b.status}\n\n`;
      kb.text(`❌ ${format(b.startsAt, "dd.MM HH:mm")}`, `cancel:${b.id}`).row();
    }
    await sendScreen(ctx, text.trim(), { parse_mode: "HTML", reply_markup: kb });
  }

  async function showNews(ctx: BotContext) {
    await touchBotUser(ctx.from!, "news_open");
    const posts = await prisma.newsPost.findMany({
      where: { broadcast: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const kb = new InlineKeyboard().text(
      T[ctx.session.lang].unsub + " / " + T[ctx.session.lang].sub,
      "news:toggle",
    );
    if (!posts.length) {
      await sendScreen(ctx, "Пока нет новостей", { reply_markup: kb });
      return;
    }
    const text = posts.map((p) => `📰 <b>${format(p.createdAt, "dd.MM")}</b>\n${p.text}`).join("\n\n");
    await sendScreen(ctx, text, { parse_mode: "HTML", reply_markup: kb });
  }

  async function adminBookings(ctx: BotContext) {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      let list = await prisma.booking.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: { gte: from, lte: to },
        },
        include: { service: true, master: true },
        orderBy: { startsAt: "asc" },
        take: 20,
      });
      // Prefer not-forgotten; if empty, show all in window
      const visible = list.filter((b) => !b.tgHidden);
      if (visible.length) list = visible;

      if (!list.length) {
        await sendScreen(ctx, "📋 Нет активных записей на ближайшие дни.", {
          reply_markup: adminKeyboard(ctx.session.lang),
        });
        return;
      }

      let text = `<b>📋 Записи (${list.length})</b>\n━━━━━━━━━━━━\n`;
      const kb = new InlineKeyboard();
      for (const b of list.slice(0, 10)) {
        const when = format(b.startsAt, "dd.MM HH:mm");
        const statusLabel =
          b.status === "PENDING" ? "ожидает" : b.status === "CONFIRMED" ? "принята" : b.status;
        text +=
          `\n<b>${when}</b> · ${statusLabel}\n` +
          `👤 ${b.clientName}\n📞 ${b.clientPhone}\n💅 ${b.service.nameRu} · ${b.master.name}\n`;
        if (b.status === "PENDING") {
          kb.text(`✅ Принять ${when}`, `bstatus:${b.id}:CONFIRMED`)
            .text("❌ Отклонить", `bstatus:${b.id}:CANCELLED`)
            .row();
        } else {
          kb.text(`✔ Check-in ${when}`, `bcheckin:${b.id}`)
            .text("Забыть", `bforget:${b.id}`)
            .row();
        }
      }
      await sendFreshScreen(ctx, text, {
        parse_mode: "HTML",
        reply_markup: kb,
      });
    } catch (e) {
      console.error("adminBookings failed", e);
      await ctx.reply("Не удалось загрузить записи. Попробуйте ещё раз.");
    }
  }

  async function adminPrices(ctx: BotContext) {
    const services = await prisma.service.findMany({ orderBy: { nameRu: "asc" } });
    const kb = new InlineKeyboard();
    services.forEach((s) => {
      kb.text(`${s.nameRu}: ${s.price.toLocaleString()}`, `price:${s.id}`).row();
    });
    await sendScreen(ctx, "Выберите услугу для смены цены:", { reply_markup: kb });
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
    await sendScreen(ctx, `👥 Всего: ${total}\n🔥 Активны 7д: ${active}\n\n${lines || "—"}`);
  }

  bot.callbackQuery("noop", async (ctx) => {
    await ctx.answerCallbackQuery();
  });

  return bot;
}
