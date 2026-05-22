import { useCallback, useEffect, useRef } from "react";

export function useTypingIndicator(ws: WebSocket | null, roomId: string, userId: string) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: "typing",
      user_id: userId,
      room_id: roomId,
    }));

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to stop typing indicator after 3 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [ws, roomId, userId]);

  const stopTyping = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: "stop_typing",
      user_id: userId,
      room_id: roomId,
    }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [ws, roomId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { startTyping, stopTyping };
}