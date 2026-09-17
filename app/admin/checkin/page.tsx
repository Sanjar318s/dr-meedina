"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Loader2 } from "lucide-react";

function CheckinInner() {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!token) {
      setState("err");
      setMsg("Нет токена QR");
      return;
    }
    setState("loading");
    fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setState("ok");
          const b = data.booking;
          setInfo(
            `${b.clientName} · ${b.service.nameRu} · ${format(new Date(b.startsAt), "dd.MM HH:mm")}`,
          );
          setMsg("Клиент отмечен — SERVED");
        } else if (data.error === "ALREADY_SERVED") {
          setState("ok");
          setMsg("Уже отмечен ранее");
        } else if (res.status === 401) {
          setState("err");
          setMsg("Войдите в админку, затем снова отсканируйте QR");
          window.location.href = `/admin?next=/admin/checkin?token=${encodeURIComponent(token)}`;
        } else {
          setState("err");
          setMsg(data.error || "Ошибка");
        }
      })
      .catch(() => {
        setState("err");
        setMsg("Сеть");
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center text-cream">
      {state === "loading" && <Loader2 className="h-8 w-8 animate-spin text-gold" />}
      {state === "ok" && <CheckCircle2 className="h-10 w-10 text-emerald-400" />}
      <p className="mt-4 font-display text-2xl">{msg}</p>
      {info && <p className="mt-2 text-sm text-muted">{info}</p>}
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense>
      <CheckinInner />
    </Suspense>
  );
}
