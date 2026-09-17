import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(2000),
  from: z.enum(["ru", "uz", "en"]),
  to: z.array(z.enum(["ru", "uz", "en"])).min(1),
});

const langMap: Record<string, string> = {
  ru: "ru-RU",
  uz: "uz-UZ",
  en: "en-GB",
};

async function translateOne(text: string, from: string, to: string) {
  if (from === to) return text;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${langMap[from]}|${langMap[to]}`);
  const res = await fetch(url.toString());
  if (!res.ok) return text;
  const data = (await res.json()) as { responseData?: { translatedText?: string } };
  return data.responseData?.translatedText || text;
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  const translations: Record<string, string> = {};
  for (const t of body.to) {
    translations[t] = await translateOne(body.text, body.from, t);
  }
  return NextResponse.json({ translations });
}
