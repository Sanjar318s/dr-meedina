# dr.meedina

Сайт студии косметологии с онлайн-записью и Telegram-ботом.

## Стек

- Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion
- Prisma + Turso (libSQL) / локальный SQLite
- next-intl (UZ / RU / EN)
- grammY Telegram bot

## Быстрый старт

1. Скопируйте env:

```bash
cp .env.example .env
```

2. Заполните `.env`:

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — для продакшена (Turso)
- `DATABASE_URL=file:./dev.db` — локальный SQLite, если Turso token ещё нет
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`
- `ADMIN_LOGIN` / `ADMIN_PASSWORD` / `JWT_SECRET`

3. Локальная БД и seed:

```bash
npm install
npx prisma db push
npm run db:seed
```

Turso DB: `dr-meedina` (`libsql://dr-meedina-sanjar318s.aws-ap-northeast-1.turso.io`).
Токен: [Turso Dashboard](https://turso.tech/app) → database `dr-meedina` → Tokens → Create Token.

4. Сайт:

```bash
npm run dev
```

Откройте http://localhost:3000/ru

5. Бот (отдельный процесс):

```bash
npm run bot
```

## Админка

Скрытый URL: `/admin` (не связан в навигации).  
После входа: `/admin/dashboard`.

## Деплой

### Сайт (Vercel)

1. Подключите репозиторий к Vercel
2. Build command: `prisma generate && next build` (уже в `npm run build`)
3. Добавьте env vars из `.env.example`
4. Для Postgres/Supabase: смените `provider` в schema на `postgresql`, задайте `DATABASE_URL` + `DIRECT_URL`
5. После деплоя: `npx prisma db push` / migrate и `npm run db:seed` против прод-БД

### Бот (Railway / Render)

1. Новый сервис из того же репо
2. Start command: `npm run bot`
3. Те же `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`
4. Бот должен работать 24/7 (long polling)

### БД

- Локально: SQLite (`file:./dev.db`)
- Прод: Supabase Postgres (рекомендуется) — см. комментарии в `.env.example`
- Опционально локальный Postgres: `docker compose up -d` (нужен Docker)

## Безопасность

Не коммитьте `.env`. Если токен бота попал в чат — перевыпустите его в BotFather (`/revoke`) и обновите env.

## Доступы по умолчанию (после seed)

- Админка: `/admin` · login `admin` / password из `ADMIN_PASSWORD`
- Языки: `/uz` `/ru` `/en`
