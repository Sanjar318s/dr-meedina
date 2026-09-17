import { createBot } from "./index";

async function main() {
  const bot = createBot();
  console.log("Bot starting (long polling)…");
  await bot.start();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
