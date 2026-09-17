import { Bot, InlineKeyboard, session } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "../lib/prisma";
import { createBooking, getAvailableSlots, cancelBooking } from "../lib/booking/slots";
import { notifyAdmin } from "../lib/telegram";
import { studioConfig } from "../lib/studio-config";

type Lang = "uz" | "ru" | "en";

type SessionData = {
  lang: Lang;
  step?: "service" | "master" | "date" | "time" | "confirm";
  serviceId?: string;
  masterId?: string;
  date?: string;
  time?: string;
};

type BotContext = Context & SessionFlavor<SessionData>;

const texts = {
  uz: {
    welcome: "Assalomu alaykum! dr.meedina botiga xush kelibsiz.",
    book: "Yozilish",
    my: "Mening yozuvlarim",
    cancel: "Bekor qilish",
    chooseService: "Xizmatni tanlang:",
    chooseMaster: "Mutaxassisni tanlang:",
    sendDate: "Sanani yuboring (YYYY-MM-DD):",
    chooseTime: "Vaqtni tanlang:",
    confirm: "Tasdiqlaysizmi?",
    yes: "Ha",
    no: "Yo'q",
    done: "Yozilish qabul qilindi!",
    noBookings: "Faol yozuvlar yo'q.",
    cancelled: "Yozuv bekor qilindi.",
    sendPhone: "Telefon raqamingizni yuboring:",
    sendName: "Ismingizni yuboring:",
  },
  ru: {
    welcome: "Здравствуйте! Добро пожаловать в бот dr.meedina.",
    book: "Записаться",
    my: "Мои записи",
    cancel: "Отменить",
    chooseService: "Выберите услугу:",
    chooseMaster: "Выберите мастера:",
    sendDate: "Отправьте дату (YYYY-MM-DD):",
    chooseTime: "Выберите время:",
    confirm: "Подтвердить запись?",
    yes: "Да",
    no: "Нет",
    done: "Запись принята!",
    noBookings: "Активных записей нет.",
    cancelled: "Запись отменена.",
    sendPhone: "Отправьте номер телефона:",
    sendName: "Отправьте ваше имя:",
  },
  en: {
    welcome: "Hello! Welcome to the dr.meedina bot.",
    book: "Book",
    my: "My bookings",
    cancel: "Cancel",
    chooseService: "Choose a service:",
    chooseMaster: "Choose a specialist:",
    sendDate: "Send a date (YYYY-MM-DD):",
    chooseTime: "Choose a time:",
    confirm: "Confirm booking?",
    yes: "Yes",
    no: "No",
    done: "Booking received!",
    noBookings: "No active bookings.",
    cancelled: "Booking cancelled.",
    sendPhone: "Send your phone number:",
    sendName: "Send your name:",
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

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is required");
    process.exit(1);
  }

  const bot = new Bot<BotContext>(token);

  bot.use(
    session({
      initial: (): SessionData => ({ lang: "ru" }),
    }),
  );

  bot.command("start", async (ctx) => {
    ctx.session.lang = detectLang(ctx.from?.language_code);
    const t = texts[ctx.session.lang];
    const kb = new InlineKeyboard()
      .text(t.book, "flow:book")
      .row()
      .text(t.my, "flow:my");
    await ctx.reply(`${t.welcome}\n\n/book /my /cancel`, { reply_markup: kb });
  });

  bot.command("book", async (ctx) => {
    ctx.session.lang = detectLang(ctx.from?.language_code);
    await startBookFlow(ctx);
  });

  bot.callbackQuery("flow:book", async (ctx) => {
    await ctx.answerCallbackQuery();
    await startBookFlow(ctx);
  });

  bot.callbackQuery("flow:my", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMy(ctx);
  });

  bot.command("my", async (ctx) => {
    await showMy(ctx);
  });

  bot.command("cancel", async (ctx) => {
    const lang = detectLang(ctx.from?.language_code);
    const t = texts[lang];
    const tgId = String(ctx.from?.id);
    const bookings = await prisma.booking.findMany({
      where: {
        clientTelegramId: tgId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gte: new Date() },
      },
      include: { service: true },
      orderBy: { startsAt: "asc" },
      take: 10,
    });
    if (!bookings.length) {
      await ctx.reply(t.noBookings);
      return;
    }
    const kb = new InlineKeyboard();
    for (const b of bookings) {
      const local = toZonedTime(b.startsAt, studioConfig.timezone);
      kb.text(
        `${format(local, "dd.MM HH:mm")} · ${serviceName(b.service, lang)}`,
        `cancel:${b.id}`,
      ).row();
    }
    await ctx.reply(t.cancel, { reply_markup: kb });
  });

  bot.callbackQuery(/^cancel:(.+)$/, async (ctx) => {
    const id = ctx.match![1];
    const lang = detectLang(ctx.from?.language_code);
    try {
      await cancelBooking(id, String(ctx.from?.id));
      await ctx.answerCallbackQuery({ text: texts[lang].cancelled });
      await ctx.editMessageText(texts[lang].cancelled);
      await notifyAdmin(`Отмена записи (бот)\nID: ${id}\nTG: ${ctx.from?.id}`);
    } catch {
      await ctx.answerCallbackQuery({ text: "Error" });
    }
  });

  bot.callbackQuery(/^svc:(.+)$/, async (ctx) => {
    ctx.session.serviceId = ctx.match![1];
    ctx.session.step = "master";
    await ctx.answerCallbackQuery();
    const lang = ctx.session.lang;
    const masters = await prisma.master.findMany({ where: { isActive: true } });
    const kb = new InlineKeyboard();
    for (const m of masters) kb.text(m.name, `mst:${m.id}`).row();
    await ctx.editMessageText(texts[lang].chooseMaster, { reply_markup: kb });
  });

  bot.callbackQuery(/^mst:(.+)$/, async (ctx) => {
    ctx.session.masterId = ctx.match![1];
    ctx.session.step = "date";
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(texts[ctx.session.lang].sendDate);
  });

  bot.callbackQuery(/^tm:(.+)$/, async (ctx) => {
    ctx.session.time = ctx.match![1];
    ctx.session.step = "confirm";
    await ctx.answerCallbackQuery();
    const lang = ctx.session.lang;
    const t = texts[lang];
    const kb = new InlineKeyboard().text(t.yes, "ok:yes").text(t.no, "ok:no");
    await ctx.editMessageText(
      `${t.confirm}\n${ctx.session.date} ${ctx.session.time}`,
      { reply_markup: kb },
    );
  });

  bot.callbackQuery("ok:no", async (ctx) => {
    ctx.session = { lang: ctx.session.lang };
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("OK");
  });

  bot.callbackQuery("ok:yes", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "confirm";
    (ctx.session as SessionData & { waitingName?: boolean }).waitingName = true;
    await ctx.reply(texts[ctx.session.lang].sendName);
  });

  bot.on("message:text", async (ctx) => {
    const sess = ctx.session as SessionData & {
      waitingName?: boolean;
      waitingPhone?: boolean;
      clientName?: string;
    };
    const text = ctx.message.text.trim();

    if (sess.step === "date" && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
      sess.date = text;
      sess.step = "time";
      if (!sess.masterId || !sess.serviceId) return;
      const slots = await getAvailableSlots({
        masterId: sess.masterId,
        date: text,
        serviceId: sess.serviceId,
      });
      if (!slots.length) {
        await ctx.reply(texts[sess.lang].chooseTime + "\n—");
        return;
      }
      const kb = new InlineKeyboard();
      for (const s of slots) kb.text(s, `tm:${s}`).row();
      await ctx.reply(texts[sess.lang].chooseTime, { reply_markup: kb });
      return;
    }

    if (sess.waitingName) {
      sess.clientName = text;
      sess.waitingName = false;
      sess.waitingPhone = true;
      await ctx.reply(texts[sess.lang].sendPhone);
      return;
    }

    if (sess.waitingPhone && sess.clientName && sess.serviceId && sess.masterId && sess.date && sess.time) {
      sess.waitingPhone = false;
      try {
        const booking = await createBooking({
          clientName: sess.clientName,
          clientPhone: text,
          clientTelegramId: String(ctx.from?.id),
          serviceId: sess.serviceId,
          masterId: sess.masterId,
          date: sess.date,
          time: sess.time,
          source: "BOT",
        });
        const local = toZonedTime(booking.startsAt, studioConfig.timezone);
        await ctx.reply(
          `${texts[sess.lang].done}\n${format(local, "dd.MM.yyyy HH:mm")}`,
        );
        await notifyAdmin(
          `<b>Новая запись (бот)</b>\n` +
            `${booking.clientName} · ${booking.clientPhone}\n` +
            `${booking.service.nameRu} · ${booking.master.name}\n` +
            `${format(local, "dd.MM.yyyy HH:mm")}\nTG: ${ctx.from?.id}`,
        );
      } catch (e) {
        await ctx.reply(e instanceof Error ? e.message : "Error");
      }
      ctx.session = { lang: sess.lang };
    }
  });

  console.log("Telegram bot started for dr.meedina");
  await bot.start();
}

async function startBookFlow(ctx: BotContext) {
  ctx.session = {
    lang: detectLang(ctx.from?.language_code),
    step: "service",
  };
  const services = await prisma.service.findMany({ where: { isActive: true } });
  const kb = new InlineKeyboard();
  for (const s of services) {
    kb.text(serviceName(s, ctx.session.lang), `svc:${s.id}`).row();
  }
  await ctx.reply(texts[ctx.session.lang].chooseService, { reply_markup: kb });
}

async function showMy(ctx: BotContext) {
  const lang = detectLang(ctx.from?.language_code);
  const bookings = await prisma.booking.findMany({
    where: {
      clientTelegramId: String(ctx.from?.id),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { service: true, master: true },
    orderBy: { startsAt: "asc" },
    take: 10,
  });
  if (!bookings.length) {
    await ctx.reply(texts[lang].noBookings);
    return;
  }
  const lines = bookings.map((b) => {
    const local = toZonedTime(b.startsAt, studioConfig.timezone);
    return `• ${format(local, "dd.MM.yyyy HH:mm")} — ${serviceName(b.service, lang)} / ${b.master.name} [${b.status}]`;
  });
  await ctx.reply(lines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
