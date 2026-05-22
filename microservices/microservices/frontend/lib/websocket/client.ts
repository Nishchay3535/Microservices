export function wsBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  const root = apiUrl.replace(/\/api\/v1\/?$/, "");
  return root.replace(/^http/i, "ws");
}

export function openChatSocket(roomId: string, token: string, handlers: { onMessage?: (data: unknown) => void }) {
  const url = `${wsBaseUrl()}/ws/chat/${roomId}?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);
  ws.onmessage = (ev) => {
    try {
      handlers.onMessage?.(JSON.parse(ev.data as string));
    } catch {
      handlers.onMessage?.(ev.data);
    }
  };
  return ws;
}
