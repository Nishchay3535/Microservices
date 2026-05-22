import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Auto-load token from persisted storage on every page load
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("he-auth");
    if (raw) {
      const token = JSON.parse(raw)?.state?.token;
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}