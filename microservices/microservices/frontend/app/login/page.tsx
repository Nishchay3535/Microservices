"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";
import { Icon, type IconName } from "@/components/common/Icons";
import { useAuthStore, type User } from "@/store/authStore";
import { redirectAfterLogin } from "@/lib/authRedirect";

type Role = "employee" | "authority" | "mentor";

const ROLES = [
  { id: "employee" as Role, label: "Employee", icon: "employee" as IconName, description: "Submit issues and connect" },
  { id: "authority" as Role, label: "Authority", icon: "shield" as IconName, description: "Review and resolve issues" },
  { id: "mentor" as Role, label: "Mentor", icon: "mentor" as IconName, description: "Guide and support people" },
];

const SELECTED_COLOR: Record<Role, string> = {
  employee: "border-sky-300 bg-sky-50 text-sky-700 ring-4 ring-sky-200/70",
  authority: "border-brand bg-brand/10 text-brand ring-4 ring-brand/20",
  mentor: "border-emerald-300 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-200/70",
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedRole) {
      setError("Please select a role before logging in.");
      return;
    }
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const res = await api.post("/auth/login", { email: trimmedEmail, password: trimmedPassword });
      const token = res.data.access_token as string;
      setAuthToken(token);
      const me = await api.get<User>("/users/me");
      const userPayload = { ...me.data, id: String(me.data.id) };

      if (selectedRole && userPayload.role !== selectedRole) {
        setAuthToken(null);
        setError(
          `This account is registered as ${userPayload.role}. Select that role above, or sign in with the matching email.`
        );
        return;
      }

      setAuth(token, userPayload);
      redirectAfterLogin(router, userPayload.role);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="animated-blob absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="animated-blob absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl [animation-delay:2s]" />
      <div className="absolute inset-0 soft-grid opacity-70" />

      <Card className="relative w-full max-w-5xl overflow-hidden p-0">
        <div className="grid min-h-[620px] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/35 blur-3xl" />
            <div className="absolute -bottom-28 left-4 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand text-lg font-black shadow-brand">
                  HE
                </div>
                <h1 className="mt-8 max-w-sm text-5xl font-black leading-[1.02] tracking-tight">
                  Care, clarity, and action in one workspace.
                </h1>
                <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
                  A private health equity and mentoring platform for support requests, issue resolution, and human follow-through.
                </p>
              </div>
              <div className="grid gap-3">
                {["Confidential issue tracking", "Realtime mentoring chat", "Transparent resolution board"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-brand">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-white shadow-brand lg:hidden">
                  HE
                </div>
                <p className="text-xs font-black uppercase text-brand">Secure access</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">Pick your role to open the right workspace.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`group rounded-3xl border p-3 text-left transition duration-300 hover:-translate-y-1 hover:shadow-brand ${
                      selectedRole === role.id ? SELECTED_COLOR[role.id] : "border-slate-200 bg-white text-slate-600 hover:border-brand/40"
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-brand">
                      <Icon name={role.icon} className="h-5 w-5" />
                    </span>
                    <span className="mt-3 block text-sm font-black">{role.label}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">{role.description}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-[288px]">
                {selectedRole ? (
                  <form className="mt-7 space-y-4 animate-fade-in" onSubmit={onSubmit}>
                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} email
                      </label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={`Enter your ${selectedRole} email`}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Password</label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}
                    <Button type="submit" className="w-full py-3" disabled={loading}>
                      {loading ? "Signing in..." : `Sign in as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
                    </Button>
                  </form>
                ) : (
                  <div className="mt-7 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center animate-fade-in">
                    <Icon name="chevronRight" className="mx-auto h-6 w-6 text-brand" />
                    <p className="mt-3 text-sm font-bold text-slate-600">Select a role to continue</p>
                  </div>
                )}
              </div>

              {selectedRole === "employee" ? (
                <p className="mt-2 text-center text-sm text-slate-500">
                  No account?{" "}
                  <Link href="/register" className="font-black text-brand hover:text-brand-dark">
                    Register
                  </Link>
                </p>
              ) : null}
              <p className="mt-2 text-center text-sm">
                <Link href="/reset-password" className="font-bold text-slate-500 hover:text-brand">
                  Forgot password?
                </Link>
              </p>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
}
