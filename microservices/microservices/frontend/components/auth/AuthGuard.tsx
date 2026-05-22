"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "@/store/authStore";

export function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
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
    if (roles && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [persistReady, token, user, roles, router]);

  if (!persistReady) return null;
  if (!token || !user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
