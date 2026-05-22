"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";

function ConfirmForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/auth/password-reset/confirm", { token, new_password: password });
      router.replace("/login");
    } catch {
      setMsg("Invalid or expired token.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-brand/20 bg-white p-8">
      <h1 className="text-xl font-bold">Set new password</h1>
      <input
        className="w-full rounded-xl border px-3 py-2"
        type="password"
        minLength={8}
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <Button type="submit" className="w-full">
        Update password
      </Button>
    </form>
  );
}

export default function ResetConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<p className="text-brand">Loading…</p>}>
        <ConfirmForm />
      </Suspense>
    </div>
  );
}
