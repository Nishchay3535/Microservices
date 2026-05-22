import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "employee" | "authority" | "mentor" | "admin";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department?: string | null;
  position?: string | null;
  avatar_url?: string | null;
  impact_score: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "he-auth" }
  )
);
