"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Globe,
  Inbox,
  LogOut,
  Newspaper,
  Receipt,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { getAdminDict, type AdminLang } from "@/lib/admin-i18n";
import { MediaAttach } from "@/components/admin/MediaAttach";
import { MultiMediaAttach } from "@/components/admin/MultiMediaAttach";
import { FieldHelp } from "@/components/admin/FieldHelp";
import { WriteLangSwitch, autoTranslate, type WriteLang } from "@/components/admin/WriteLangSwitch";
import { BookingReceipt } from "@/components/admin/BookingReceipt";

type Booking = {
  id: string;
  clientName: string;
  clientPhone: string;
  status: string;
  source: string;
  startsAt: string;
  checkToken: string;
  service: { nameRu: string };
  master: { name: string };
};

type Stats = { week: number; month: number; pending: number; confirmed: number };

type Service = {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  price: number;
  durationMinutes: number;
  imageUrl?: string | null;
  gallery?: string | null;
  videoUrl?: string | null;
  category: string;
  isActive: boolean;
};

type Master = {
  id: string;
  name: string;
  photoUrl?: string | null;
  specializationUz: string;
  specializationRu: string;
  specializationEn: string;
  bioUz: string;
  bioRu: string;
  bioEn: string;
  isActive: boolean;
};

type SiteRow = Record<string, string | number | null>;
type News = {
  id: string;
  text: string;
  imageUrl?: string | null;
  imageUrls?: string | null;
  broadcast: boolean;
  createdAt: string;
};
type Ticker = {
  id: string;
  textUz: string;
  textRu: string;
  textEn: string;
  isActive: boolean;
};
type Schedule = {
  workDays: number[];
  openHour: number;
  closeHour: number;
  slotStepMinutes: number;
  closedDates: string[];
};
type BotStats = {
  total: number;
  active: number;
  users: {
    id: string;
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastSeenAt: string;
    activities: { action: string; createdAt: string }[];
  }[];
};

type Tab = "bookings" | "services" | "masters" | "site" | "schedule" | "news" | "botUsers";

function parseJsonArr(raw: unknown, fallback: unknown[] = []): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function AdminDashboard() {
  const [lang, setLang] = useState<AdminLang>("ru");
  const t = getAdminDict(lang);
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [settings, setSettings] = useState<SiteRow | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [ticker, setTicker] = useState<Ticker[]>([]);
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [editService, setEditService] = useState<Service | null>(null);
  const [editMaster, setEditMaster] = useState<Master | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin-lang") as AdminLang | null;
    if (saved === "uz" || saved === "ru" || saved === "en") setLang(saved);
  }, []);

  function switchLang(l: AdminLang) {
    setLang(l);
    localStorage.setItem("admin-lang", l);
  }

  async function loadBookings() {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (source) q.set("source", source);
    if (date) q.set("date", date);
    const res = await fetch(`/api/admin/bookings?${q}`);
    if (res.ok) setBookings(await res.json());
  }

  async function loadStats() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }

  useEffect(() => {
    loadBookings();
    loadStats();
  }, [status, source, date]);

  useEffect(() => {
    if (tab === "services") fetch("/api/admin/services").then((r) => r.json()).then(setServices);
    if (tab === "masters") fetch("/api/admin/masters").then((r) => r.json()).then(setMasters);
    if (tab === "site") fetch("/api/admin/settings").then((r) => r.json()).then(setSettings);
    if (tab === "schedule") {
      fetch("/api/admin/schedule")
        .then((r) => r.json())
        .then((row) =>
          setSchedule({
            workDays: parseJsonArr(row.workDays, [1, 2, 3, 4, 5, 6]) as number[],
            openHour: row.openHour ?? 10,
            closeHour: row.closeHour ?? 20,
            slotStepMinutes: row.slotStepMinutes ?? 30,
            closedDates: parseJsonArr(row.closedDates, []) as string[],
          }),
        );
    }
    if (tab === "news") {
      fetch("/api/admin/news").then((r) => r.json()).then(setNews);
      fetch("/api/admin/ticker").then((r) => r.json()).then(setTicker);
    }
    if (tab === "botUsers") fetch("/api/admin/bot-users").then((r) => r.json()).then(setBotStats);
  }, [tab]);

  async function patchBooking(id: string, patch: Record<string, string | boolean>) {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await loadBookings();
    await loadStats();
  }

  async function deleteBooking(b: Booking) {
    const ok = window.confirm(
      `${t.deleteConfirm}\n\n${b.clientName} · ${format(new Date(b.startsAt), "dd.MM.yyyy HH:mm")}`,
    );
    if (!ok) return;
    const res = await fetch(`/api/admin/bookings?id=${encodeURIComponent(b.id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMsg("Ошибка удаления");
      return;
    }
    if (receiptId === b.id) setReceiptId(null);
    setMsg(t.deleted);
    await loadBookings();
    await loadStats();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "bookings", label: t.bookings, icon: <CalendarCheck className="h-4 w-4" /> },
    { id: "schedule", label: t.schedule, icon: <CalendarClock className="h-4 w-4" /> },
    { id: "services", label: t.services, icon: <Sparkles className="h-4 w-4" /> },
    { id: "masters", label: t.masters, icon: <UserRound className="h-4 w-4" /> },
    { id: "site", label: t.site, icon: <Settings className="h-4 w-4" /> },
    { id: "news", label: t.news, icon: <Newspaper className="h-4 w-4" /> },
    { id: "botUsers", label: t.botUsers, icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-cream">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl">{t.title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 text-xs tracking-wider">
            {(["uz", "ru", "en"] as AdminLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchLang(l)}
                className={`px-2 py-1 uppercase ${lang === l ? "text-gold" : "text-sand hover:text-cream"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-sm text-sand hover:text-gold">
            <LogOut className="h-4 w-4" /> {t.logout}
          </button>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm text-gold">{msg}</p>}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<CalendarDays className="h-5 w-5" />} label={t.week} value={stats?.week ?? 0} />
        <Stat icon={<CalendarRange className="h-5 w-5" />} label={t.month} value={stats?.month ?? 0} />
        <Stat icon={<Clock className="h-5 w-5" />} label={t.pending} value={stats?.pending ?? 0} />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label={t.confirmed} value={stats?.confirmed ?? 0} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm transition ${
              tab === item.id ? "bg-gold/15 text-gold ring-1 ring-gold/40" : "text-muted hover:bg-white/5 hover:text-cream"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "bookings" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <select className="admin-input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t.allStatuses}</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SERVED">SERVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select className="admin-input max-w-[180px]" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">{t.allSources}</option>
              <option value="SITE">SITE</option>
              <option value="BOT">BOT</option>
            </select>
            <input type="date" className="admin-input max-w-[180px]" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="overflow-x-auto ring-1 ring-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-sand">
                <tr>
                  <th className="px-3 py-3">{t.when}</th>
                  <th className="px-3 py-3">{t.client}</th>
                  <th className="px-3 py-3">{t.service}</th>
                  <th className="px-3 py-3">{t.master}</th>
                  <th className="px-3 py-3">{t.status}</th>
                  <th className="px-3 py-3">{t.source}</th>
                  <th className="px-3 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted">
                      <Inbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      {t.empty}
                    </td>
                  </tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-white/8 hover:bg-white/[0.03]">
                    <td className="px-3 py-3">{format(new Date(b.startsAt), "dd.MM.yyyy HH:mm")}</td>
                    <td className="px-3 py-3">
                      {b.clientName}
                      <br />
                      <span className="text-xs text-muted">{b.clientPhone}</span>
                    </td>
                    <td className="px-3 py-3">{b.service.nameRu}</td>
                    <td className="px-3 py-3">{b.master.name}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-sand">
                        {b.source === "BOT" ? <Globe className="h-3 w-3" /> : null}
                        {b.source}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="text-gold" title="Принять" onClick={() => patchBooking(b.id, { status: "CONFIRMED" })}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" className="text-sand" title="Отклонить" onClick={() => patchBooking(b.id, { status: "CANCELLED" })}>
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-gold"
                          title={t.receipt}
                          onClick={() => setReceiptId(receiptId === b.id ? null : b.id)}
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-red-300/80 hover:text-red-300"
                          title={t.delete}
                          onClick={() => void deleteBooking(b)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {receiptId && (() => {
            const b = bookings.find((x) => x.id === receiptId);
            if (!b) return null;
            return (
              <BookingReceipt
                booking={b}
                showCheckIn
                onCheckIn={() => {
                  loadBookings();
                  setReceiptId(null);
                }}
              />
            );
          })()}
        </div>
      )}

      {tab === "schedule" && schedule && (
        <SchedulePanel
          initial={schedule}
          onSaved={() => setMsg(t.saved)}
        />
      )}

      {tab === "services" && (
        <div className="mt-6 space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-3">
                {s.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className="h-12 w-16 object-cover" />
                )}
                <div>
                  <p className="text-cream">{s.nameRu}</p>
                  <p className="text-sm text-sand">
                    {s.durationMinutes} мин · {s.price.toLocaleString()} · {s.isActive ? "active" : "off"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" className="inline-flex items-center gap-1 text-sm text-gold" onClick={() => setEditService(s)}>
                  <Edit3 className="h-3.5 w-3.5" /> {t.edit}
                </button>
                <button
                  type="button"
                  className="text-sm text-sand hover:text-gold"
                  onClick={async () => {
                    await fetch(`/api/admin/services?id=${s.id}&activate=${s.isActive ? "0" : "1"}`, { method: "DELETE" });
                    setServices(await (await fetch("/api/admin/services")).json());
                  }}
                >
                  {s.isActive ? t.deactivate : t.activate}
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-gold" onClick={() => setEditService(emptyService())}>
            + {t.addService}
          </button>
          {editService && (
            <ServiceForm
              initial={editService}
              labels={t}
              onClose={() => setEditService(null)}
              onSaved={async () => {
                setEditService(null);
                setMsg(t.saved);
                setServices(await (await fetch("/api/admin/services")).json());
              }}
            />
          )}
        </div>
      )}

      {tab === "masters" && (
        <div className="mt-6 space-y-3">
          {masters.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-3">
                {m.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt="" className="h-12 w-12 object-cover" />
                )}
                <div>
                  <p>{m.name}</p>
                  <p className="text-sm text-sand">{m.specializationRu}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" className="inline-flex items-center gap-1 text-sm text-gold" onClick={() => setEditMaster(m)}>
                  <Edit3 className="h-3.5 w-3.5" /> {t.edit}
                </button>
                <button
                  type="button"
                  className="text-sm text-sand hover:text-gold"
                  onClick={async () => {
                    await fetch(`/api/admin/masters?id=${m.id}&activate=${m.isActive ? "0" : "1"}`, { method: "DELETE" });
                    setMasters(await (await fetch("/api/admin/masters")).json());
                  }}
                >
                  {m.isActive ? t.deactivate : t.activate}
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-gold" onClick={() => setEditMaster(emptyMaster())}>
            + {t.addMaster}
          </button>
          {editMaster && (
            <MasterForm
              initial={editMaster}
              labels={t}
              onClose={() => setEditMaster(null)}
              onSaved={async () => {
                setEditMaster(null);
                setMsg(t.saved);
                setMasters(await (await fetch("/api/admin/masters")).json());
              }}
            />
          )}
        </div>
      )}

      {tab === "site" && settings && (
        <SiteForm
          initial={settings}
          labels={t}
          onSaved={async () => {
            setMsg(t.saved);
            setSettings(await (await fetch("/api/admin/settings")).json());
          }}
        />
      )}

      {tab === "news" && (
        <NewsPanel
          items={news}
          ticker={ticker}
          labels={t}
          onChange={async () => {
            setNews(await (await fetch("/api/admin/news")).json());
            setTicker(await (await fetch("/api/admin/ticker")).json());
          }}
        />
      )}

      {tab === "botUsers" && botStats && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat icon={<Users className="h-5 w-5" />} label={t.totalUsers} value={botStats.total} />
            <Stat icon={<Users className="h-5 w-5" />} label={t.activeUsers} value={botStats.active} />
          </div>
          <div className="space-y-2">
            {botStats.users.map((u) => (
              <div key={u.id} className="border border-white/10 px-4 py-3 text-sm">
                <p className="text-cream">
                  {u.firstName || "—"} {u.username ? `@${u.username}` : ""} · {u.telegramId}
                </p>
                <p className="text-xs text-muted">
                  last: {format(new Date(u.lastSeenAt), "dd.MM.yyyy HH:mm")} · {u.activities.map((a) => a.action).join(", ") || "—"}
                </p>
              </div>
            ))}
            {botStats.users.length === 0 && <p className="text-muted">{t.empty}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="relative border border-white/10 bg-white/[0.03] p-4">
      <div className="absolute right-3 top-3 text-gold/50">{icon}</div>
      <p className="text-xs uppercase tracking-widest text-sand">{label}</p>
      <p className="mt-2 font-display text-3xl text-gold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "CONFIRMED" || status === "SERVED"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "CANCELLED"
        ? "bg-white/10 text-muted"
        : "bg-amber-500/15 text-amber-200";
  return <span className={`inline-flex px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}

function emptyService(): Service {
  return {
    id: "",
    nameUz: "",
    nameRu: "",
    nameEn: "",
    descriptionUz: "",
    descriptionRu: "",
    descriptionEn: "",
    durationMinutes: 60,
    price: 0,
    imageUrl: "",
    gallery: "[]",
    videoUrl: "",
    category: "general",
    isActive: true,
  };
}

function emptyMaster(): Master {
  return {
    id: "",
    name: "",
    photoUrl: "",
    specializationUz: "",
    specializationRu: "",
    specializationEn: "",
    bioUz: "",
    bioRu: "",
    bioEn: "",
    isActive: true,
  };
}

function ServiceForm({
  initial,
  labels,
  onClose,
  onSaved,
}: {
  initial: Service;
  labels: ReturnType<typeof getAdminDict>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [writeLang, setWriteLang] = useState<WriteLang>("ru");
  const [gallery, setGallery] = useState<string[]>(() => parseJsonArr(initial.gallery) as string[]);
  const [draftName, setDraftName] = useState(initial.nameRu);
  const [draftDesc, setDraftDesc] = useState(initial.descriptionRu);

  async function translate() {
    const names = await autoTranslate(draftName, writeLang);
    const descs = await autoTranslate(draftDesc, writeLang);
    setForm({
      ...form,
      nameRu: names.ru,
      nameUz: names.uz,
      nameEn: names.en,
      descriptionRu: descs.ru,
      descriptionUz: descs.uz,
      descriptionEn: descs.en,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let names = { ru: form.nameRu, uz: form.nameUz, en: form.nameEn };
    let descs = {
      ru: form.descriptionRu,
      uz: form.descriptionUz,
      en: form.descriptionEn,
    };
    if (!form.nameRu || form.nameRu === initial.nameRu) {
      names = await autoTranslate(draftName, writeLang);
      descs = await autoTranslate(draftDesc, writeLang);
    }
    const payload = {
      ...form,
      nameRu: names.ru,
      nameUz: names.uz,
      nameEn: names.en,
      descriptionRu: descs.ru,
      descriptionUz: descs.uz,
      descriptionEn: descs.en,
      gallery: gallery.length ? JSON.stringify(gallery) : null,
      imageUrl: form.imageUrl || null,
      videoUrl: form.videoUrl || null,
    };
    await fetch("/api/admin/services", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
    });
    onSaved();
  }

  return (
    <form onSubmit={save} className="grid gap-3 border border-gold/30 bg-ink p-4">
      <WriteLangSwitch value={writeLang} onChange={setWriteLang} />
      <input
        className="admin-input"
        placeholder={`${labels.name} (${writeLang})`}
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        required
      />
      <textarea
        className="admin-input"
        placeholder={`${labels.desc} (${writeLang})`}
        value={draftDesc}
        onChange={(e) => setDraftDesc(e.target.value)}
        required
      />
      <button type="button" className="text-left text-xs text-gold" onClick={() => void translate()}>
        {labels.translate} → RU / UZ / EN
      </button>
      <p className="text-[11px] text-muted">
        RU: {form.nameRu || "—"} · UZ: {form.nameUz || "—"} · EN: {form.nameEn || "—"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="admin-input" type="number" placeholder={labels.duration} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} required />
        <input className="admin-input" type="number" placeholder={labels.price} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
      </div>
      <MediaAttach label={labels.imageUrl} value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
      <MultiMediaAttach label={labels.gallery} value={gallery} onChange={setGallery} />
      <MediaAttach kind="video" label={labels.videoUrl} value={form.videoUrl} onChange={(url) => setForm({ ...form, videoUrl: url })} />
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary !py-2 text-xs">{labels.save}</button>
        <button type="button" className="btn-ghost !py-2 text-xs" onClick={onClose}>{labels.cancel}</button>
      </div>
    </form>
  );
}

function MasterForm({
  initial,
  labels,
  onClose,
  onSaved,
}: {
  initial: Master;
  labels: ReturnType<typeof getAdminDict>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [writeLang, setWriteLang] = useState<WriteLang>("ru");
  const [draftSpec, setDraftSpec] = useState(initial.specializationRu);
  const [draftBio, setDraftBio] = useState(initial.bioRu);

  async function translate() {
    const specs = await autoTranslate(draftSpec, writeLang);
    const bios = await autoTranslate(draftBio, writeLang);
    setForm({
      ...form,
      specializationRu: specs.ru,
      specializationUz: specs.uz,
      specializationEn: specs.en,
      bioRu: bios.ru,
      bioUz: bios.uz,
      bioEn: bios.en,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let specs = {
      ru: form.specializationRu,
      uz: form.specializationUz,
      en: form.specializationEn,
    };
    let bios = { ru: form.bioRu, uz: form.bioUz, en: form.bioEn };
    if (!form.specializationRu || form.specializationRu === initial.specializationRu) {
      specs = await autoTranslate(draftSpec, writeLang);
      bios = await autoTranslate(draftBio, writeLang);
    }
    const payload = {
      ...form,
      specializationRu: specs.ru,
      specializationUz: specs.uz,
      specializationEn: specs.en,
      bioRu: bios.ru,
      bioUz: bios.uz,
      bioEn: bios.en,
      photoUrl: form.photoUrl || null,
    };
    await fetch("/api/admin/masters", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
    });
    onSaved();
  }

  return (
    <form onSubmit={save} className="grid gap-3 border border-gold/30 bg-ink p-4">
      <input className="admin-input" placeholder={labels.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <MediaAttach label={labels.photoUrl} value={form.photoUrl} aspect={1} onChange={(url) => setForm({ ...form, photoUrl: url })} />
      <WriteLangSwitch value={writeLang} onChange={setWriteLang} />
      <input className="admin-input" placeholder={`${labels.specialization} (${writeLang})`} value={draftSpec} onChange={(e) => setDraftSpec(e.target.value)} required />
      <textarea className="admin-input" placeholder={`${labels.bio} (${writeLang})`} value={draftBio} onChange={(e) => setDraftBio(e.target.value)} required />
      <button type="button" className="text-left text-xs text-gold" onClick={() => void translate()}>{labels.translate}</button>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary !py-2 text-xs">{labels.save}</button>
        <button type="button" className="btn-ghost !py-2 text-xs" onClick={onClose}>{labels.cancel}</button>
      </div>
    </form>
  );
}

function SchedulePanel({ initial, onSaved }: { initial: Schedule; onSaved: () => void }) {
  const [form, setForm] = useState(initial);
  const [newClosed, setNewClosed] = useState("");
  const days = [
    { n: 1, l: "Пн" },
    { n: 2, l: "Вт" },
    { n: 3, l: "Ср" },
    { n: 4, l: "Чт" },
    { n: 5, l: "Пт" },
    { n: 6, l: "Сб" },
    { n: 7, l: "Вс" },
  ];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
  }

  return (
    <form onSubmit={save} className="mt-6 max-w-xl space-y-5 border border-white/10 p-5">
      <div>
        <p className="text-sm text-cream">
          Рабочие дни
          <FieldHelp text="Выключенный день = выходной. На сайте и в боте эти даты не предлагаются." />
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {days.map((d) => (
            <label key={d.n} className="inline-flex items-center gap-1 text-sm text-sand">
              <input
                type="checkbox"
                checked={form.workDays.includes(d.n)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workDays: e.target.checked
                      ? [...form.workDays, d.n].sort()
                      : form.workDays.filter((x) => x !== d.n),
                  })
                }
              />
              {d.l}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted">
          Открытие
          <FieldHelp text="Час начала приёма (например 10)." />
          <input className="admin-input mt-1" type="number" min={0} max={23} value={form.openHour} onChange={(e) => setForm({ ...form, openHour: Number(e.target.value) })} />
        </label>
        <label className="text-xs text-muted">
          Закрытие
          <FieldHelp text="Час конца (например 20). Последний слот должен закончиться к этому времени." />
          <input className="admin-input mt-1" type="number" min={1} max={24} value={form.closeHour} onChange={(e) => setForm({ ...form, closeHour: Number(e.target.value) })} />
        </label>
        <label className="text-xs text-muted">
          Шаг (мин)
          <FieldHelp text="Интервал между слотами, обычно 30 минут." />
          <input className="admin-input mt-1" type="number" min={5} max={120} value={form.slotStepMinutes} onChange={(e) => setForm({ ...form, slotStepMinutes: Number(e.target.value) })} />
        </label>
      </div>
      <div>
        <p className="text-sm text-cream">
          Доп. выходные / праздники
          <FieldHelp text="Конкретные даты, когда клиника не работает (поверх дней недели)." />
        </p>
        <div className="mt-2 flex gap-2">
          <input type="date" className="admin-input" value={newClosed} onChange={(e) => setNewClosed(e.target.value)} />
          <button
            type="button"
            className="btn-ghost !py-2 text-xs"
            onClick={() => {
              if (newClosed && !form.closedDates.includes(newClosed)) {
                setForm({ ...form, closedDates: [...form.closedDates, newClosed].sort() });
                setNewClosed("");
              }
            }}
          >
            +
          </button>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-sand">
          {form.closedDates.map((d) => (
            <li key={d} className="flex justify-between">
              {d}
              <button type="button" className="text-xs text-gold" onClick={() => setForm({ ...form, closedDates: form.closedDates.filter((x) => x !== d) })}>
                удалить
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" className="btn-primary">Сохранить</button>
    </form>
  );
}

function SiteForm({
  initial,
  labels,
  onSaved,
}: {
  initial: SiteRow;
  labels: ReturnType<typeof getAdminDict>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [writeLang, setWriteLang] = useState<WriteLang>("ru");
  const [draftHeadline, setDraftHeadline] = useState(String(initial.heroHeadlineRu || ""));
  const [draftSub, setDraftSub] = useState(String(initial.heroSubRu || ""));
  const [draftAboutTitle, setDraftAboutTitle] = useState(String(initial.aboutTitleRu || ""));
  const [draftAboutText, setDraftAboutText] = useState(String(initial.aboutTextRu || ""));
  const [draftTagline, setDraftTagline] = useState(String(initial.taglineRu || ""));
  const [draftAddress, setDraftAddress] = useState(String(initial.addressRu || ""));
  const [draftPhoneNote, setDraftPhoneNote] = useState(String(initial.phoneNoteRu || ""));

  function set(key: string, val: string | number | null) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function translateAll() {
    const [h, s, at, ab, tg, ad, pn] = await Promise.all([
      autoTranslate(draftHeadline, writeLang),
      autoTranslate(draftSub, writeLang),
      autoTranslate(draftAboutTitle, writeLang),
      autoTranslate(draftAboutText, writeLang),
      autoTranslate(draftTagline, writeLang),
      autoTranslate(draftAddress, writeLang),
      autoTranslate(draftPhoneNote, writeLang),
    ]);
    setForm((f) => ({
      ...f,
      heroHeadlineRu: h.ru,
      heroHeadlineUz: h.uz,
      heroHeadlineEn: h.en,
      heroSubRu: s.ru,
      heroSubUz: s.uz,
      heroSubEn: s.en,
      aboutTitleRu: at.ru,
      aboutTitleUz: at.uz,
      aboutTitleEn: at.en,
      aboutTextRu: ab.ru,
      aboutTextUz: ab.uz,
      aboutTextEn: ab.en,
      taglineRu: tg.ru,
      taglineUz: tg.uz,
      taglineEn: tg.en,
      addressRu: ad.ru,
      addressUz: ad.uz,
      addressEn: ad.en,
      phoneNoteRu: pn.ru,
      phoneNoteUz: pn.uz,
      phoneNoteEn: pn.en,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    // Ensure draft fields land on the write language if user skipped auto-translate
    const payload = {
      ...form,
      heroHeadlineRu: form.heroHeadlineRu || draftHeadline,
      heroHeadlineUz: form.heroHeadlineUz || draftHeadline,
      heroHeadlineEn: form.heroHeadlineEn || draftHeadline,
      heroSubRu: form.heroSubRu || draftSub,
      heroSubUz: form.heroSubUz || draftSub,
      heroSubEn: form.heroSubEn || draftSub,
      aboutTitleRu: form.aboutTitleRu || draftAboutTitle,
      aboutTitleUz: form.aboutTitleUz || draftAboutTitle,
      aboutTitleEn: form.aboutTitleEn || draftAboutTitle,
      aboutTextRu: form.aboutTextRu || draftAboutText,
      aboutTextUz: form.aboutTextUz || draftAboutText,
      aboutTextEn: form.aboutTextEn || draftAboutText,
      taglineRu: form.taglineRu || draftTagline,
      taglineUz: form.taglineUz || draftTagline,
      taglineEn: form.taglineEn || draftTagline,
      addressRu: form.addressRu || draftAddress,
      addressUz: form.addressUz || draftAddress,
      addressEn: form.addressEn || draftAddress,
      phoneNoteRu: form.phoneNoteRu || draftPhoneNote,
      phoneNoteUz: form.phoneNoteUz || draftPhoneNote,
      phoneNoteEn: form.phoneNoteEn || draftPhoneNote,
      lat: Number(form.lat),
      lng: Number(form.lng),
    };
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    onSaved();
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-8">
      <section className="space-y-2 border border-white/10 p-4">
        <h3 className="font-display text-xl text-gold">
          Бренд
          <FieldHelp text="Название клиники и имя врача на сайте." />
        </h3>
        <input className="admin-input" value={String(form.brand ?? "")} onChange={(e) => set("brand", e.target.value)} placeholder="Brand" />
        <input className="admin-input" value={String(form.doctorName ?? "")} onChange={(e) => set("doctorName", e.target.value)} placeholder="Doctor" />
      </section>

      <section className="space-y-3 border border-white/10 p-4">
        <h3 className="font-display text-xl text-gold">
          Hero
          <FieldHelp text="Видео и текст первого экрана главной страницы." />
        </h3>
        <MediaAttach kind="video" label="Hero video" value={form.heroVideoUrl as string} onChange={(u) => set("heroVideoUrl", u)} />
        <MediaAttach label="Welcome / бот фото" value={form.welcomeImageUrl as string} onChange={(u) => set("welcomeImageUrl", u)} />
        <WriteLangSwitch value={writeLang} onChange={setWriteLang} />
        <input className="admin-input" placeholder="Заголовок" value={draftHeadline} onChange={(e) => setDraftHeadline(e.target.value)} />
        <textarea className="admin-input" placeholder="Подзаголовок" value={draftSub} onChange={(e) => setDraftSub(e.target.value)} />
      </section>

      <section className="space-y-3 border border-white/10 p-4">
        <h3 className="font-display text-xl text-gold">
          О клинике
          <FieldHelp text="Блок «О нас» между hero и услугами." />
        </h3>
        <input className="admin-input" placeholder="Заголовок about" value={draftAboutTitle} onChange={(e) => setDraftAboutTitle(e.target.value)} />
        <textarea className="admin-input" rows={4} placeholder="Текст about" value={draftAboutText} onChange={(e) => setDraftAboutText(e.target.value)} />
        <input className="admin-input" placeholder="Tagline" value={draftTagline} onChange={(e) => setDraftTagline(e.target.value)} />
      </section>

      <section className="space-y-4 border border-white/10 p-4">
        <h3 className="font-display text-xl text-gold">
          Контакты и Яндекс.Карта
          <FieldHelp text="Эти данные идут на страницу «Контакты»: адрес, заметка и карта. Координаты — центр карты и точка-маркер." />
        </h3>

        <label className="block text-xs text-muted">
          Адрес (как на сайте)
          <FieldHelp text="Полный адрес клиники. Напишите на выбран выше, затем «Автоперевод»." />
          <input
            className="admin-input mt-1"
            placeholder="Ташкент, …"
            value={draftAddress}
            onChange={(e) => setDraftAddress(e.target.value)}
          />
        </label>

        <label className="block text-xs text-muted">
          Телефон
          <input
            className="admin-input mt-1"
            placeholder="+998 …"
            value={String(form.phone ?? "")}
            onChange={(e) => set("phone", e.target.value)}
          />
        </label>

        <label className="block text-xs text-muted">
          Заметка под телефоном
          <FieldHelp text="Например: «Полный номер — в Instagram или боте»." />
          <input
            className="admin-input mt-1"
            placeholder="Как связаться"
            value={draftPhoneNote}
            onChange={(e) => setDraftPhoneNote(e.target.value)}
          />
        </label>

        <div className="border border-white/10 bg-white/[0.02] p-3">
          <p className="text-sm text-cream">
            Яндекс.Карта
            <FieldHelp text="Откройте maps.yandex.ru → найдите точку → ПКМ → «Что здесь?» → скопируйте широту и долготу." />
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Формат: широта около 41.3, долгота около 69.2 (Ташкент). На карте слева — широта, справа — долгота.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted">
              Широта (lat)
              <input
                className="admin-input mt-1"
                type="number"
                step="any"
                value={Number(form.lat) || 0}
                onChange={(e) => set("lat", Number(e.target.value))}
              />
            </label>
            <label className="block text-xs text-muted">
              Долгота (lng)
              <input
                className="admin-input mt-1"
                type="number"
                step="any"
                value={Number(form.lng) || 0}
                onChange={(e) => set("lng", Number(e.target.value))}
              />
            </label>
          </div>
          {Number(form.lat) && Number(form.lng) ? (
            <div className="mt-3 aspect-[16/10] w-full overflow-hidden ring-1 ring-white/10">
              <iframe
                title="Yandex map preview"
                className="h-full w-full border-0"
                loading="lazy"
                src={`https://yandex.ru/map-widget/v1/?ll=${form.lng}%2C${form.lat}&z=15&pt=${form.lng}%2C${form.lat},pm2rdm`}
              />
            </div>
          ) : (
            <p className="mt-3 text-xs text-sand">Укажите lat/lng — здесь появится превью карты.</p>
          )}
          <a
            className="mt-2 inline-block text-xs text-gold hover:underline"
            href={`https://yandex.ru/maps/?ll=${form.lng}%2C${form.lat}&z=15&pt=${form.lng},${form.lat}`}
            target="_blank"
            rel="noreferrer"
          >
            Открыть в Яндекс.Картах →
          </a>
        </div>
      </section>

      <section className="space-y-2 border border-white/10 p-4">
        <h3 className="font-display text-xl text-gold">
          Ссылки
          <FieldHelp text="Instagram и ссылка на бота записи (кнопка «Бот записи»)." />
        </h3>
        <label className="block text-xs text-muted">
          Instagram URL
          <input className="admin-input mt-1" value={String(form.instagram ?? "")} onChange={(e) => set("instagram", e.target.value)} />
        </label>
        <label className="block text-xs text-muted">
          Бот записи URL
          <input className="admin-input mt-1" value={String(form.telegramBot ?? "")} onChange={(e) => set("telegramBot", e.target.value)} />
        </label>
      </section>

      <button type="button" className="text-sm text-gold" onClick={() => void translateAll()}>
        {labels.translate} всех текстов
      </button>
      <button type="submit" className="btn-primary">{labels.save}</button>
    </form>
  );
}

function NewsPanel({
  items,
  ticker,
  labels,
  onChange,
}: {
  items: News[];
  ticker: Ticker[];
  labels: ReturnType<typeof getAdminDict>;
  onChange: () => void;
}) {
  const [mode, setMode] = useState<"pick" | "tg" | "site">("pick");
  const [tgStep, setTgStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [tgText, setTgText] = useState("");
  const [sentMsg, setSentMsg] = useState("");
  const [writeLang, setWriteLang] = useState<WriteLang>("ru");
  const [tickerDraft, setTickerDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendTg(broadcast: boolean) {
    setBusy(true);
    setSentMsg("");
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tgText, imageUrls: photos, broadcast }),
      });
      const data = await res.json();
      if (broadcast && data.broadcastResult) {
        setSentMsg(`Отправлено ${data.broadcastResult.sent} подписчикам`);
      } else {
        setSentMsg("Сохранено");
      }
      setMode("pick");
      setTgStep(1);
      setPhotos([]);
      setTgText("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function addTicker() {
    const texts = await autoTranslate(tickerDraft, writeLang);
    await fetch("/api/admin/ticker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textUz: texts.uz, textRu: texts.ru, textEn: texts.en }),
    });
    setTickerDraft("");
    setMode("pick");
    onChange();
  }

  return (
    <div className="mt-6 space-y-6">
      {mode === "pick" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="border border-gold/40 bg-gold/10 p-6 text-left transition hover:bg-gold/20" onClick={() => { setMode("tg"); setTgStep(1); }}>
            <p className="font-display text-2xl text-gold">{labels.toTelegram}</p>
            <p className="mt-2 text-sm text-muted">Рассылка подписчикам с фото</p>
          </button>
          <button type="button" className="border border-white/15 bg-white/[0.03] p-6 text-left transition hover:bg-white/[0.06]" onClick={() => setMode("site")}>
            <p className="font-display text-2xl text-cream">{labels.toSite}</p>
            <p className="mt-2 text-sm text-muted">
              Короткая строка на главной
              <FieldHelp text="Короткие новости бегут между блоками О клинике и Услуги" />
            </p>
          </button>
        </div>
      )}

      {mode === "tg" && (
        <div className="border border-gold/30 p-5">
          <p className="text-xs text-sand">Шаг {tgStep} / 3</p>
          {tgStep === 1 && (
            <div className="mt-3 space-y-3">
              <p className="text-cream">Прикрепите фото (можно несколько)</p>
              <MultiMediaAttach value={photos} onChange={setPhotos} />
              <div className="flex gap-2">
                <button type="button" className="btn-primary !py-2 text-xs" onClick={() => setTgStep(2)} disabled={!photos.length}>Далее</button>
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => { setPhotos([]); setTgStep(2); }}>Без фото</button>
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setMode("pick")}>{labels.cancel}</button>
              </div>
            </div>
          )}
          {tgStep === 2 && (
            <div className="mt-3 space-y-3">
              <p className="text-cream">Текст (подпись к фото) — как есть, без перевода</p>
              <textarea className="admin-input" rows={5} value={tgText} onChange={(e) => setTgText(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" className="btn-primary !py-2 text-xs" disabled={!tgText.trim()} onClick={() => setTgStep(3)}>Далее</button>
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setTgStep(1)}>Назад</button>
              </div>
            </div>
          )}
          {tgStep === 3 && (
            <div className="mt-3 space-y-3">
              <p className="text-cream">Превью</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={p} alt="" className="h-20 w-28 object-cover" />
                ))}
              </div>
              <p className="whitespace-pre-wrap text-sm text-sand">{tgText}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary !py-2 text-xs" disabled={busy} onClick={() => void sendTg(true)}>Отправить всем</button>
                <button type="button" className="btn-ghost !py-2 text-xs" disabled={busy} onClick={() => void sendTg(false)}>Только сохранить</button>
                <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setTgStep(2)}>Назад</button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "site" && (
        <div className="border border-white/10 p-5 space-y-3">
          <WriteLangSwitch value={writeLang} onChange={setWriteLang} />
          <input className="admin-input" maxLength={80} placeholder="До 80 символов" value={tickerDraft} onChange={(e) => setTickerDraft(e.target.value)} />
          <div className="flex gap-2">
            <button type="button" className="btn-primary !py-2 text-xs" disabled={!tickerDraft.trim()} onClick={() => void addTicker()}>Добавить на сайт</button>
            <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setMode("pick")}>{labels.cancel}</button>
          </div>
        </div>
      )}

      {sentMsg && <p className="text-sm text-emerald-300">{sentMsg}</p>}

      <div>
        <h3 className="text-sm uppercase tracking-wider text-sand">Дорожка на сайте</h3>
        <div className="mt-2 space-y-2">
          {ticker.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center justify-between gap-2 border border-white/10 px-3 py-2 text-sm">
              <span className={it.isActive ? "text-cream" : "text-muted line-through"}>{it.textRu}</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-gold"
                  onClick={async () => {
                    await fetch("/api/admin/ticker", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...it, isActive: !it.isActive }),
                    });
                    onChange();
                  }}
                >
                  {it.isActive ? labels.deactivate : labels.activate}
                </button>
                <button
                  type="button"
                  className="text-sand"
                  onClick={async () => {
                    await fetch(`/api/admin/ticker?id=${it.id}`, { method: "DELETE" });
                    onChange();
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wider text-sand">Рассылки</h3>
        <div className="mt-2 space-y-2">
          {items.map((n) => (
            <div key={n.id} className="border border-white/10 px-4 py-3 text-sm">
              <p className="whitespace-pre-wrap text-cream line-clamp-3">{n.text}</p>
              <p className="mt-2 text-xs text-muted">
                {format(new Date(n.createdAt), "dd.MM.yyyy HH:mm")}
                {n.broadcast ? " · отправлено" : ""}
              </p>
              <button
                type="button"
                className="mt-2 text-sand"
                onClick={async () => {
                  await fetch(`/api/admin/news?id=${n.id}`, { method: "DELETE" });
                  onChange();
                }}
              >
                удалить
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
