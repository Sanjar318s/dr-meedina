"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

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
  nameRu: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
};

type Master = {
  id: string;
  name: string;
  specializationRu: string;
  isActive: boolean;
};

export function AdminDashboard() {
  const [tab, setTab] = useState<"bookings" | "services" | "masters">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");

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

  async function loadServices() {
    const res = await fetch("/api/admin/services");
    if (res.ok) setServices(await res.json());
  }

  async function loadMasters() {
    const res = await fetch("/api/admin/masters");
    if (res.ok) setMasters(await res.json());
  }

  useEffect(() => {
    loadBookings();
    loadStats();
  }, [status, source, date]);

  useEffect(() => {
    if (tab === "services") loadServices();
    if (tab === "masters") loadMasters();
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-cream">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Admin · dr.meedina</h1>
        <button type="button" onClick={logout} className="text-sm text-sand hover:text-gold">
          Выйти
        </button>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="За неделю" value={stats.week} />
          <Stat label="За месяц" value={stats.month} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Confirmed" value={stats.confirmed} />
        </div>
      )}

      <div className="mt-8 flex gap-4 text-sm">
        {(["bookings", "services", "masters"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? "text-gold" : "text-sand"}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "bookings" && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-white/15 bg-ink px-2 py-1 text-sm"
            >
              <option value="">Все статусы</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="border border-white/15 bg-ink px-2 py-1 text-sm"
            >
              <option value="">Все источники</option>
              <option value="SITE">SITE</option>
              <option value="BOT">BOT</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-white/15 bg-ink px-2 py-1 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-sand">
                <tr>
                  <th className="py-2">Когда</th>
                  <th>Клиент</th>
                  <th>Услуга</th>
                  <th>Мастер</th>
                  <th>Статус</th>
                  <th>Источник</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-white/10">
                    <td className="py-3">{format(new Date(b.startsAt), "dd.MM.yyyy HH:mm")}</td>
                    <td>
                      {b.clientName}
                      <br />
                      <span className="text-sand">{b.clientPhone}</span>
                    </td>
                    <td>{b.service.nameRu}</td>
                    <td>{b.master.name}</td>
                    <td>{b.status}</td>
                    <td>{b.source}</td>
                    <td className="space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        className="text-gold"
                        onClick={() => patchBooking(b.id, { status: "CONFIRMED" })}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        className="text-sand"
                        onClick={() => patchBooking(b.id, { status: "CANCELLED" })}
                      >
                        X
                      </button>
                      <button
                        type="button"
                        className="text-sand"
                        onClick={() => {
                          const date = window.prompt("Новая дата YYYY-MM-DD");
                          const time = window.prompt("Новое время HH:mm");
                          if (date && time) patchBooking(b.id, { date, time });
                        }}
                      >
                        ↔
                      </button>
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
            <div key={s.id} className="flex items-center justify-between border border-white/10 px-4 py-3">
              <div>
                <p>{s.nameRu}</p>
                <p className="text-sm text-sand">
                  {s.durationMinutes} мин · {s.price} · {s.isActive ? "active" : "off"}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-sand hover:text-gold"
                onClick={async () => {
                  await fetch(`/api/admin/services?id=${s.id}`, { method: "DELETE" });
                  loadServices();
                }}
              >
                Deactivate
              </button>
            </div>
          ))}
          <ServiceCreateForm onDone={loadServices} />
        </div>
      )}

      {tab === "masters" && (
        <div className="mt-6 space-y-3">
          {masters.map((m) => (
            <div key={m.id} className="flex items-center justify-between border border-white/10 px-4 py-3">
              <div>
                <p>{m.name}</p>
                <p className="text-sm text-sand">
                  {m.specializationRu} · {m.isActive ? "active" : "off"}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-sand hover:text-gold"
                onClick={async () => {
                  await fetch(`/api/admin/masters?id=${m.id}`, { method: "DELETE" });
                  loadMasters();
                }}
              >
                Deactivate
              </button>
            </div>
          ))}
          <MasterCreateForm onDone={loadMasters} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 p-4">
      <p className="text-xs uppercase tracking-widest text-sand">{label}</p>
      <p className="mt-2 font-display text-3xl text-gold">{value}</p>
    </div>
  );
}

function ServiceCreateForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  async function create(form: FormData) {
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameUz: form.get("name"),
        nameRu: form.get("name"),
        nameEn: form.get("name"),
        descriptionUz: form.get("desc"),
        descriptionRu: form.get("desc"),
        descriptionEn: form.get("desc"),
        durationMinutes: Number(form.get("duration")),
        price: Number(form.get("price")),
        category: "general",
      }),
    });
    setOpen(false);
    onDone();
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-gold">
        + Добавить услугу
      </button>
    );
  }
  return (
    <form
      className="grid gap-2 border border-white/10 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await create(new FormData(e.currentTarget));
      }}
    >
      <input name="name" placeholder="Название" required className="bg-transparent border border-white/15 px-2 py-1" />
      <input name="desc" placeholder="Описание" required className="bg-transparent border border-white/15 px-2 py-1" />
      <input name="duration" type="number" placeholder="Минуты" required className="bg-transparent border border-white/15 px-2 py-1" />
      <input name="price" type="number" placeholder="Цена" required className="bg-transparent border border-white/15 px-2 py-1" />
      <button type="submit" className="text-gold text-sm">Сохранить</button>
    </form>
  );
}

function MasterCreateForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-gold">
        + Добавить мастера
      </button>
    );
  }
  return (
    <form
      className="grid gap-2 border border-white/10 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        await fetch("/api/admin/masters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            specializationUz: form.get("spec"),
            specializationRu: form.get("spec"),
            specializationEn: form.get("spec"),
            bioUz: form.get("bio"),
            bioRu: form.get("bio"),
            bioEn: form.get("bio"),
          }),
        });
        setOpen(false);
        onDone();
      }}
    >
      <input name="name" placeholder="Имя" required className="bg-transparent border border-white/15 px-2 py-1" />
      <input name="spec" placeholder="Специализация" required className="bg-transparent border border-white/15 px-2 py-1" />
      <input name="bio" placeholder="Био" required className="bg-transparent border border-white/15 px-2 py-1" />
      <button type="submit" className="text-gold text-sm">Сохранить</button>
    </form>
  );
}
