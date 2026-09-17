import { webhookCallback } from "grammy";
import { createBot } from "@/bot/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bot = createBot();
const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(req: Request) {
  try {
    return await handleUpdate(req);
  } catch (e) {
    console.error("telegram webhook error", e);
    return new Response("ok", { status: 200 });
  }
}
