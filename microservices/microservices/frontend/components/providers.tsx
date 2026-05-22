"use client";

import { useEffect } from "react";
import { setAuthToken } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  return (
    <div id="main-content" tabIndex={-1}>
      {children}
    </div>
  );
}
