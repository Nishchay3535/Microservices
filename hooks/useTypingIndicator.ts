import { useCallback, useEffect, useRef, useState } from "react";

const OUTGOING_MS = 2000;
const INCOMING_CLEAR_MS = 3000;

type TypingPayload = {
  type?: string;
  sender_id?: string;
  sender_name?: string;
};

/**
 * Debounced outbound typing events and inbound "Name is typing..." labels.
 * Wire `onSocketPayload` into the chat WebSocket `onmessage` handler.
 */
export function useTypingIndicator(ws: WebSocket | null, roomId: string, currentUserId: string | undefined) {
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const lastSentRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const onSocketPayload = useCallback(
    (raw: unknown) => {
      if (!raw || typeof raw !== "object") return;
      const data = raw as TypingPayload;
      if (data.type !== "typing") return;
      if (data.sender_id && currentUserId && data.sender_id === currentUserId) return;
      const name = typeof data.sender_name === "string" && data.sender_name.trim() ? data.sender_name : "Someone";
      setTypingLabel(`${name} is typing...`);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setTypingLabel(null), INCOMING_CLEAR_MS);
    },
    [currentUserId]
  );

  const sendTyping = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return;
    const now = Date.now();
    if (now - lastSentRef.current < OUTGOING_MS) return;
    lastSentRef.current = now;
    ws.send(JSON.stringify({ type: "typing", room_id: roomId }));
  }, [ws, roomId]);

  return { typingLabel, sendTyping, onSocketPayload };
}
