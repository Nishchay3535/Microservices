"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await api.post("/auth/password-reset/request", { email });
    setMsg("If an account exists, a reset link was sent (check server logs in dev).");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft/40 px-4">
      <div className="w-full max-w-md rounded-3xl border border-brand/20 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">Reset password</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
        {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
        <Link href="/login" className="mt-6 block text-center text-sm text-brand">
          Back to login
        </Link>
      </div>
    </div>
  );
}
