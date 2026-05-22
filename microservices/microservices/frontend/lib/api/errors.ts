import { isAxiosError } from "axios";

/**
 * Turns FastAPI / Axios error bodies into a readable string.
 * detail can be: string | { msg }[] | object
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (!isAxiosError(err)) {
    return err instanceof Error ? err.message : fallback;
  }
  if (!err.response) {
    return "Cannot reach API. Start the backend (uvicorn) and set NEXT_PUBLIC_API_URL in .env.local — e.g. http://127.0.0.1:8000/api/v1";
  }
  const data = err.response?.data as { detail?: unknown } | undefined;
  const detail = data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return JSON.stringify(item);
      })
      .join(" ");
  }

  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: string }).message);
  }

  if (detail != null && typeof detail !== "string") {
    return JSON.stringify(detail);
  }

  if (err.message) return err.message;
  return fallback;
}
