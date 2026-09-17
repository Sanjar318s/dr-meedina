"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarCheck,
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
  Settings,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { getAdminDict, type AdminLang } from "@/lib/admin-i18n";

type Booking = {
  id: string;
  clientName: string;
  clientPhone: string;
  status: string;
  source: string;
  startsAt: string;
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
type News = { id: string; text: string; imageUrl?: string | null; broadcast: boolean; createdAt: string };
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

type Tab = "bookings" | "services" | "masters" | "site" | "news" | "botUsers";

export function AdminDashboard() {
  const [lang, setLang] = useState<AdminLang>("ru");
  const t = getAdminDict(lang);
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [settings, setSettings] = useState<SiteRow | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [editService, setEditService] = useState<Service | null>(null);
  const [editMaster, setEditMaster] = useState<Master | null>(null);
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
    if (tab === "news") fetch("/api/admin/news").then((r) => r.json()).then(setNews);
    if (tab === "botUsers") fetch("/api/admin/bot-users").then((r) => r.json()).then(setBotStats);
  }, [tab]);

  async function patchBooking(id: string, patch: Record<string, string>) {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await loadBookings();
    await loadStats();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "bookings", label: t.bookings, icon: <CalendarCheck className="h-4 w-4" /> },
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
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-sand hover:text-gold"
          >
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
              tab === item.id
                ? "bg-gold/15 text-gold ring-1 ring-gold/40"
                : "text-muted hover:bg-white/5 hover:text-cream"
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
                        <button type="button" className="text-gold" onClick={() => patchBooking(b.id, { status: "CONFIRMED" })}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" className="text-sand" onClick={() => patchBooking(b.id, { status: "CANCELLED" })}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    {s.videoUrl ? " · video" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-gold"
                  onClick={() => {
                    let gallery = s.gallery || "";
                    try {
                      const parsed = JSON.parse(gallery);
                      if (Array.isArray(parsed)) gallery = parsed.join(", ");
                    } catch {
                      /* keep */
                    }
                    setEditService({ ...s, gallery });
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5" /> {t.edit}
                </button>
                <button
                  type="button"
                  className="text-sm text-sand hover:text-gold"
                  onClick={async () => {
                    await fetch(`/api/admin/services?id=${s.id}&activate=${s.isActive ? "0" : "1"}`, { method: "DELETE" });
                    setTab("services");
                    const res = await fetch("/api/admin/services");
                    setServices(await res.json());
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
                const res = await fetch("/api/admin/services");
                setServices(await res.json());
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
                  <p className="text-sm text-sand">
                    {m.specializationRu} · {m.isActive ? "active" : "off"}
                  </p>
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
                    const res = await fetch("/api/admin/masters");
                    setMasters(await res.json());
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
                const res = await fetch("/api/admin/masters");
                setMasters(await res.json());
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
            const res = await fetch("/api/admin/settings");
            setSettings(await res.json());
          }}
        />
      )}

      {tab === "news" && (
        <NewsPanel
          items={news}
          labels={t}
          onChange={async () => {
            const res = await fetch("/api/admin/news");
            setNews(await res.json());
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
                  last: {format(new Date(u.lastSeenAt), "dd.MM.yyyy HH:mm")} ·{" "}
                  {u.activities.map((a) => a.action).join(", ") || "—"}
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
    status === "CONFIRMED"
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
    gallery: "",
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
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const galleryArr = (form.gallery || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const payload = {
      ...form,
      gallery: galleryArr.length ? JSON.stringify(galleryArr) : null,
      imageUrl: form.imageUrl || null,
      videoUrl: form.videoUrl || null,
      nameUz: form.nameUz || form.nameRu,
      nameEn: form.nameEn || form.nameRu,
      descriptionUz: form.descriptionUz || form.descriptionRu,
      descriptionEn: form.descriptionEn || form.descriptionRu,
    };
    await fetch("/api/admin/services", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
    });
    onSaved();
  }
  return (
    <form onSubmit={save} className="grid gap-2 border border-gold/30 bg-ink p-4">
      <input className="admin-input" placeholder={`${labels.name} RU`} value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} required />
      <input className="admin-input" placeholder={`${labels.name} UZ`} value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
      <input className="admin-input" placeholder={`${labels.name} EN`} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
      <textarea className="admin-input" placeholder={labels.desc} value={form.descriptionRu} onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })} required />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="admin-input" type="number" placeholder={labels.duration} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} required />
        <input className="admin-input" type="number" placeholder={labels.price} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
      </div>
      <input className="admin-input" placeholder={labels.imageUrl} value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      <input className="admin-input" placeholder={labels.gallery} value={form.gallery || ""} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
      <input className="admin-input" placeholder={labels.videoUrl} value={form.videoUrl || ""} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
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
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      photoUrl: form.photoUrl || null,
      specializationUz: form.specializationUz || form.specializationRu,
      specializationEn: form.specializationEn || form.specializationRu,
      bioUz: form.bioUz || form.bioRu,
      bioEn: form.bioEn || form.bioRu,
    };
    await fetch("/api/admin/masters", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
    });
    onSaved();
  }
  return (
    <form onSubmit={save} className="grid gap-2 border border-gold/30 bg-ink p-4">
      <input className="admin-input" placeholder={labels.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="admin-input" placeholder={labels.photoUrl} value={form.photoUrl || ""} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
      <input className="admin-input" placeholder={`${labels.specialization} RU`} value={form.specializationRu} onChange={(e) => setForm({ ...form, specializationRu: e.target.value })} required />
      <input className="admin-input" placeholder={`${labels.specialization} UZ`} value={form.specializationUz} onChange={(e) => setForm({ ...form, specializationUz: e.target.value })} />
      <input className="admin-input" placeholder={`${labels.specialization} EN`} value={form.specializationEn} onChange={(e) => setForm({ ...form, specializationEn: e.target.value })} />
      <textarea className="admin-input" placeholder={`${labels.bio} RU`} value={form.bioRu} onChange={(e) => setForm({ ...form, bioRu: e.target.value })} required />
      <textarea className="admin-input" placeholder={`${labels.bio} UZ`} value={form.bioUz} onChange={(e) => setForm({ ...form, bioUz: e.target.value })} />
      <textarea className="admin-input" placeholder={`${labels.bio} EN`} value={form.bioEn} onChange={(e) => setForm({ ...form, bioEn: e.target.value })} />
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary !py-2 text-xs">{labels.save}</button>
        <button type="button" className="btn-ghost !py-2 text-xs" onClick={onClose}>{labels.cancel}</button>
      </div>
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
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
      }),
    });
    onSaved();
  }
  const fields = [
    "brand",
    "doctorName",
    "addressRu",
    "addressUz",
    "addressEn",
    "phone",
    "phoneNoteRu",
    "phoneNoteUz",
    "phoneNoteEn",
    "lat",
    "lng",
    "instagram",
    "telegram",
    "telegramBot",
    "taglineRu",
    "taglineUz",
    "taglineEn",
    "welcomeImageUrl",
  ];
  return (
    <form onSubmit={save} className="mt-6 grid gap-2 sm:grid-cols-2">
      {fields.map((key) => (
        <label key={key} className="block text-xs text-muted">
          {key}
          <input
            className="admin-input mt-1"
            value={String(form[key] ?? "")}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">{labels.save}</button>
      </div>
    </form>
  );
}

function NewsPanel({
  items,
  labels,
  onChange,
}: {
  items: News[];
  labels: ReturnType<typeof getAdminDict>;
  onChange: () => void;
}) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  async function create(broadcast: boolean) {
    await fetch("/api/admin/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, imageUrl: imageUrl || null, broadcast }),
    });
    setText("");
    setImageUrl("");
    onChange();
  }
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-2 border border-white/10 p-4">
        <textarea className="admin-input" placeholder={labels.newsText} value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        <input className="admin-input" placeholder={labels.imageUrl} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => create(false)} disabled={!text.trim()}>
            {labels.save}
          </button>
          <button type="button" className="btn-primary !py-2 text-xs" onClick={() => create(true)} disabled={!text.trim()}>
            {labels.broadcast}
          </button>
        </div>
      </div>
      {items.map((n) => (
        <div key={n.id} className="border border-white/10 px-4 py-3 text-sm">
          <p className="whitespace-pre-wrap text-cream">{n.text}</p>
          <p className="mt-2 text-xs text-muted">
            {format(new Date(n.createdAt), "dd.MM.yyyy HH:mm")}
            {n.broadcast ? " · sent" : ""}
          </p>
          <div className="mt-2 flex gap-3">
            {!n.broadcast && (
              <button
                type="button"
                className="text-gold"
                onClick={async () => {
                  await fetch("/api/admin/bot-users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "broadcast", newsId: n.id }),
                  });
                  onChange();
                }}
              >
                {labels.broadcast}
              </button>
            )}
            <button
              type="button"
              className="text-sand"
              onClick={async () => {
                await fetch(`/api/admin/news?id=${n.id}`, { method: "DELETE" });
                onChange();
              }}
            >
              {labels.deactivate}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
