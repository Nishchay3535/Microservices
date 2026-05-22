"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";
import { useAuthStore, type User } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
        role: "employee",
      });
      const token = res.data.access_token as string;
      setAuthToken(token);
      const me = await api.get<User>("/users/me");
      setAuth(token, { ...me.data, id: String(me.data.id) });
      router.replace("/employee");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Registration failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="animated-blob absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="animated-blob absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl [animation-delay:2s]" />
      <Card className="relative w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-lg font-black text-white shadow-brand">
            HE
          </div>
          <p className="text-xs font-black uppercase text-brand">Employee access</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Employee access starts here. Role upgrades are managed by an admin.
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-bold text-slate-700">Full name</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">Password (min 8)</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}
          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-black text-brand">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
