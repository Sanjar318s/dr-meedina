"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Неверный логин или пароль");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 w-full max-w-sm space-y-4">
      <input
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder="Login"
        className="w-full border border-white/15 bg-transparent px-3 py-2 text-cream outline-none focus:border-gold"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full border border-white/15 bg-transparent px-3 py-2 text-cream outline-none focus:border-gold"
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full border border-gold py-2 text-gold hover:bg-gold hover:text-ink"
      >
        Войти
      </button>
    </form>
  );
}
