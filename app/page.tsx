"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { redirectAfterLogin } from "@/lib/authRedirect";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setPersistReady(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setPersistReady(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    redirectAfterLogin(router, user.role);
  }, [persistReady, token, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 text-center shadow-brand backdrop-blur">
        <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-2xl bg-brand shadow-brand" />
        <p className="text-sm font-black text-brand">Loading...</p>
      </div>
    </div>
  );
}
