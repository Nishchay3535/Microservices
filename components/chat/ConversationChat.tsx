"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { EmptyState, LoadingSkeleton } from "@/components/common/UI";
import { Icon } from "@/components/common/Icons";
import { api, setAuthToken } from "@/lib/api/client";
import { openChatSocket } from "@/lib/websocket/client";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useAuthStore } from "@/store/authStore";
import AISuggestedReply from "@/components/AISuggestedReply";

type RoomType = "authority" | "mentor";
type Mode = "employee" | "participant";

type UserRow = {
  id: string;
  full_name: string;
};

type RoomRow = {
  id: string;
  room_type: RoomType;
  employee_id: string;
  participant_id: string;
  employee_name: string;
  participant_name: string;
  last_message?: string | null;
  last_message_at?: string | null;
  last_sender_id?: string | null;
  last_sender_name?: string | null;
};

type Conversation = {
  id?: string;
  roomType: RoomType;
  otherUserId: string;
  otherName: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastSenderId?: string | null;
  lastSenderName?: string | null;
};

type Msg = {
  id?: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  read?: boolean;
};

type Props = {
  mode: Mode;
  roomType: RoomType;
  directoryEndpoint?: string;
  initialOtherUserId?: string;
  emptyText: string;
  showAIAssist?: boolean;
};

const IST_TIME_ZONE = "Asia/Kolkata";

function parseServerDate(value: string) {
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function formatTime(value?: string | null) {
  if (!value) return "";
  return parseServerDate(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST_TIME_ZONE,
  });
}

function formatDay(value?: string | null) {
  if (!value) return "";
  const date = parseServerDate(value);
  const today = new Date();
  const dayFormat = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: IST_TIME_ZONE,
    year: "numeric",
  });
  if (dayFormat.format(date) === dayFormat.format(today)) return formatTime(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST_TIME_ZONE });
}

function sortTimestamp(value?: string | null) {
  return value ? parseServerDate(value).getTime() : 0;
}

function previewText(conversation: Conversation, meId?: string) {
  if (!conversation.lastMessage) return "No messages yet";
  const prefix = conversation.lastSenderId === meId ? "You: " : "";
  return `${prefix}${conversation.lastMessage}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getChatSeenStorageKey(userId: string) {
  return `chat-seen-rooms:${userId}`;
}

function loadSeenRooms(userId: string) {
  try {
    const raw = window.localStorage.getItem(getChatSeenStorageKey(userId));
    if (!raw) return new Set<string>();
    return new Set<string>(JSON.parse(raw));
  } catch {
    return new Set<string>();
  }
}

function saveSeenRooms(userId: string, rooms: Set<string>) {
  try {
    window.localStorage.setItem(getChatSeenStorageKey(userId), JSON.stringify(Array.from(rooms)));
  } catch {
    // ignore storage failures
  }
}

export function ConversationChat({ mode, roomType, directoryEndpoint, initialOtherUserId, emptyText, showAIAssist }: Props) {
  const me = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [people, setPeople] = useState<UserRow[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [seenRooms, setSeenRooms] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [chatWs, setChatWs] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { typingLabel, sendTyping, onSocketPayload } = useTypingIndicator(chatWs, active?.id ?? "", me?.id);

  const getRoomKey = (conversation: Conversation) => `${conversation.roomType}:${conversation.otherUserId}`;

  useEffect(() => {
    if (!me?.id) return;
    setSeenRooms(loadSeenRooms(me.id));
  }, [me?.id]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoaded(false);
    setError("");
    setAuthToken(token);

    async function load(showLoading: boolean) {
      if (showLoading) setLoaded(false);
      try {
        const [roomResult, peopleResult] = await Promise.all([
          api.get(`/chat/rooms?room_type=${roomType}`),
          mode === "employee" && directoryEndpoint ? api.get(directoryEndpoint) : Promise.resolve({ data: [] }),
        ]);
        if (!alive) return;
        const nextRooms = (roomResult.data as RoomRow[]).map((room) => ({
          ...room,
          id: String(room.id),
          employee_id: String(room.employee_id),
          participant_id: String(room.participant_id),
          last_sender_id: room.last_sender_id ? String(room.last_sender_id) : null,
        }));
        setRooms(nextRooms);
        setPeople((peopleResult.data as UserRow[]).map((person) => ({ ...person, id: String(person.id) })));
        setActive((current) => {
          if (!current?.id) return current;
          const room = nextRooms.find((item) => item.id === current.id);
          if (!room) return current;
          return {
            ...current,
            lastMessage: room.last_message,
            lastMessageAt: room.last_message_at,
            lastSenderId: room.last_sender_id,
            lastSenderName: room.last_sender_name,
          };
        });
      } catch {
        if (alive) setError("Unable to load conversations.");
      } finally {
        if (alive && showLoading) setLoaded(true);
      }
    }

    void load(true);
    const interval = setInterval(() => void load(false), 3000);
    return () => {
      alive = false;
      clearInterval(interval);
      wsRef.current?.close();
      setChatWs(null);
    };
  }, [directoryEndpoint, mode, roomType, token]);

  const conversations = useMemo<Conversation[]>(() => {
    const items: Conversation[] =
      mode === "employee"
        ? people.map((person) => {
            const room = rooms.find((roomItem) => String(roomItem.participant_id) === person.id);
            return {
              id: room?.id,
              roomType,
              otherUserId: person.id,
              otherName: person.full_name,
              lastMessage: room?.last_message,
              lastMessageAt: room?.last_message_at,
              lastSenderId: room?.last_sender_id,
              lastSenderName: room?.last_sender_name,
            };
          })
        : rooms.map((room) => ({
            id: room.id,
            roomType: room.room_type,
            otherUserId: room.employee_id,
            otherName: room.employee_name,
            lastMessage: room.last_message,
            lastMessageAt: room.last_message_at,
            lastSenderId: room.last_sender_id,
            lastSenderName: room.last_sender_name,
          }));

    const deduped = new Map<string, Conversation>();
    for (const conversation of items) {
      const key = `${conversation.roomType}-${conversation.otherUserId}`;
      const existing = deduped.get(key);
      if (!existing || sortTimestamp(conversation.lastMessageAt) > sortTimestamp(existing.lastMessageAt)) {
        deduped.set(key, conversation);
      }
    }

    return Array.from(deduped.values()).sort((a, b) => sortTimestamp(b.lastMessageAt) - sortTimestamp(a.lastMessageAt));
  }, [mode, people, roomType, rooms]);


  function updatePreview(roomId: string, message: Msg) {
    setRooms((prev) =>
      prev
        .map((room) =>
          room.id === roomId
            ? {
                ...room,
                last_message: message.content,
                last_message_at: message.created_at,
                last_sender_id: message.sender_id,
                last_sender_name: message.sender_name,
              }
            : room
        )
        .sort((a, b) => sortTimestamp(b.last_message_at) - sortTimestamp(a.last_message_at))
    );
    setActive((current) =>
      current?.id === roomId
        ? {
            ...current,
            lastMessage: message.content,
            lastMessageAt: message.created_at,
            lastSenderId: message.sender_id,
            lastSenderName: message.sender_name,
          }
        : current
    );
  }

  async function deleteConversation(roomId: string) {
    if (!token) return;
    setDeletingRoomId(roomId);
    setError("");
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setActive((current) => {
        if (current?.id === roomId) {
          wsRef.current?.close();
          setChatWs(null);
          return null;
        }
        return current;
      });
    } catch {
      setError("Unable to delete this chat.");
    } finally {
      setDeletingRoomId(null);
    }
  }

  async function openConversation(conversation: Conversation) {
    if (!token) return;
    setConnecting(true);
    setError("");
    setMessages([]);
    wsRef.current?.close();
    setChatWs(null);

    const key = getRoomKey(conversation);
    setSeenRooms((prev) => {
      const next = new Set(prev);
      next.add(key);
      if (me?.id) saveSeenRooms(me.id, next);
      window.dispatchEvent(new Event("chat-seen-updated"));
      return next;
    });

    try {
      let roomId = conversation.id;
      if (!roomId) {
        const response = await api.post("/chat/rooms", {
          room_type: roomType,
          other_user_id: conversation.otherUserId,
        });
        const room = response.data as RoomRow;
        roomId = String(room.id);
        setRooms((prev) => [
          {
            ...room,
            id: roomId!,
            room_type: roomType,
            employee_id: String(room.employee_id),
            participant_id: String(room.participant_id),
          },
          ...prev,
        ]);
      }

      const nextActive = { ...conversation, id: roomId };
      setActive(nextActive);

      const ws = openChatSocket(roomId, token, {
        onMessage: (raw) => {
          const data = raw as {
            type: string;
            history?: Msg[];
            id?: string;
            content?: string;
            sender_id?: string;
            sender_name?: string;
            reader_id?: string;
            created_at?: string;
            detail?: string;
            room_id?: string;
          };
          onSocketPayload(data);
          if (data.type === "typing") {
            return;
          }
          if (data.type === "history") {
            setMessages((data.history ?? []).map((msg) => ({ ...msg, read: msg.sender_id === me?.id ? true : undefined })));
            return;
          }
          if (data.type === "new_message" && data.content) {
            const message = {
              id: data.id,
              content: data.content,
              sender_id: data.sender_id ?? "",
              sender_name: data.sender_name ?? "",
              created_at: data.created_at ?? new Date().toISOString(),
              read: data.sender_id === me?.id ? false : undefined,
            };
            setMessages((prev) => [...prev, message]);
            updatePreview(roomId!, message);
            if (data.sender_id !== me?.id) {
              const currentKey = getRoomKey({ ...conversation, id: roomId!, roomType, otherUserId: conversation.otherUserId });
              setSeenRooms((prev) => {
                const next = new Set(prev);
                next.add(currentKey);
                if (me?.id) saveSeenRooms(me.id, next);
                window.dispatchEvent(new Event("chat-seen-updated"));
                return next;
              });
              wsRef.current?.send(JSON.stringify({ type: "mark_read" }));
            }
            return;
          }
          if (data.type === "read_receipt" && data.reader_id !== me?.id) {
            setMessages((prev) => prev.map((msg) => (msg.sender_id === me?.id ? { ...msg, read: true } : msg)));
            return;
          }
          if (data.type === "error") setError(data.detail ?? "Chat connection error.");
        },
      });
      ws.onclose = () => {
        setConnecting(false);
        setChatWs(null);
      };
      ws.onerror = () => {
        setConnecting(false);
        setError("Realtime connection failed.");
      };
      ws.onopen = () => {
        setConnecting(false);
        setChatWs(ws);
        ws.send(JSON.stringify({ type: "mark_read" }));
      };
      wsRef.current = ws;
    } catch {
      setConnecting(false);
      setError("Unable to open this conversation.");
    }
  }

  useEffect(() => {
    if (!loaded || !initialOtherUserId || active) return;
    const openInitialConversation = async () => {
      const matchingRoom = rooms.find((room) => room.employee_id === initialOtherUserId);
      if (matchingRoom) {
        await openConversation({
          id: matchingRoom.id,
          roomType: matchingRoom.room_type,
          otherUserId: matchingRoom.employee_id,
          otherName: matchingRoom.employee_name,
          lastMessage: matchingRoom.last_message,
          lastMessageAt: matchingRoom.last_message_at,
          lastSenderId: matchingRoom.last_sender_id,
          lastSenderName: matchingRoom.last_sender_name,
        });
      } else {
        await openConversation({
          roomType,
          otherUserId: initialOtherUserId,
          otherName: initialOtherUserId,
        });
      }
    };
    void openInitialConversation();
  }, [loaded, initialOtherUserId, active, rooms, roomType]);

  function send() {
    if (!input.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Chat is reconnecting. Open the conversation again and retry.");
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "send_message", content: input.trim() }));
    setInput("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const title = roomType === "authority" ? "Authority" : "Mentor";

  const lastOtherMessage = messages.slice().reverse().find((message) => message.sender_id !== me?.id);
  const activeStatus = connecting
    ? "Connecting..."
    : lastOtherMessage
    ? `Last seen ${formatTime(lastOtherMessage.created_at)}`
    : active?.lastMessageAt
    ? `Last active ${formatTime(active.lastMessageAt)}`
    : "Online now";

  return (
    <div className="grid min-h-[720px] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex min-h-[320px] flex-col border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-900 lg:border-b-0 lg:border-r lg:border-slate-200">
        <div className="relative overflow-hidden px-5 py-5">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-brand/35 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-slate-500">Inbox</p>
              <h2 className="mt-1 text-2xl font-black">{title} chat</h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-brand">
              <Icon name="chat" />
            </span>
          </div>
          <div className="relative mt-5 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            Realtime support channel
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
          {!loaded && (
            <div className="px-2 py-2">
              <LoadingSkeleton rows={4} />
            </div>
          )}
          {loaded && error && <p className="mx-2 rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-100">{error}</p>}
          {loaded && !error && conversations.length === 0 && (
            <div className="px-2 py-3">
              <EmptyState icon="chat" title="Quiet inbox" text={emptyText} />
            </div>
          )}
          {conversations.map((conversation) => {
            const roomKey = `${conversation.roomType}:${conversation.otherUserId}`;
            const isUnread =
              conversation.lastSenderId &&
              conversation.lastSenderId !== me?.id &&
              !seenRooms.has(roomKey);
            return (
              <div
                key={`${conversation.roomType}-${conversation.otherUserId}`}
                className={`flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 transition ${
                  active?.otherUserId === conversation.otherUserId
                    ? "rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-brand"
                    : "rounded-3xl border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void openConversation(conversation)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-sm font-black text-white shadow-brand">
                    {initials(conversation.otherName)}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-black">{conversation.otherName}</span>
                      <span
                        className={`shrink-0 text-[11px] ${
                          active?.otherUserId === conversation.otherUserId ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {formatDay(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span
                      className={`mt-1 flex items-center justify-between gap-2 text-xs ${
                        active?.otherUserId === conversation.otherUserId ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      <span className="truncate">{previewText(conversation, me?.id)}</span>
                      <span className="flex items-center gap-1">
                        {isUnread && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-black text-white">
                            •
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                </button>
                {conversation.id && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void deleteConversation(conversation.id!);
                    }}
                    disabled={deletingRoomId === conversation.id}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
                    aria-label="Delete chat"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        {!active ? (
          <div className="flex flex-1 items-center justify-center bg-white px-6">
            <EmptyState
              icon="spark"
              title="Choose a conversation"
              text="Open a support thread to see message history, live status, and reply in real time."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-sm font-black text-white shadow-brand">
                {initials(active.otherName)}
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              </span>
              <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-950">{active.otherName}</p>
                  <p className="text-xs font-semibold text-emerald-600">{activeStatus}</p>
                </div>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-black text-brand">
                {roomType}
              </span>
            </div>

            <div className="relative flex-1 overflow-y-auto px-4 py-6">
              <div className="absolute inset-0 opacity-[0.08] soft-grid" />
              <div className="relative mx-auto max-w-4xl space-y-3">
                {messages.length === 0 && (
                  <EmptyState icon="chat" title="No messages yet" text="Send the first message to start a private support thread." />
                )}
                {messages.map((message, index) => {
                  const isMe = message.sender_id === me?.id;
                  return (
                    <div key={message.id ?? index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-xl transition duration-200 hover:-translate-y-0.5 ${
                          isMe
                            ? "rounded-br-md bg-brand text-white shadow-brand"
                            : "rounded-bl-md bg-white text-slate-900 shadow-slate-300/60"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-4">
                          <p className={`text-[11px] font-black ${isMe ? "text-white/80" : "text-brand"}`}>
                            {isMe ? "You" : message.sender_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className={`text-[10px] font-semibold ${isMe ? "text-white/65" : "text-slate-400"}`}>
                              {formatTime(message.created_at)}
                            </p>
                            {isMe && (
                              <Icon
                                name={message.read ? "checkDouble" : "check"}
                                className={message.read ? "h-3.5 w-3.5 text-sky-500" : "h-3.5 w-3.5 text-slate-400"}
                              />
                            )}
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
                {connecting && (
                  <div className="flex justify-start">
                    <div className="rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-xl shadow-slate-300/60">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200/70 bg-white/95 p-4 backdrop-blur">
              {showAIAssist && (
                <AISuggestedReply
                  issueId={null}
                  employeeId={active.otherUserId}
                  recentMessages={messages.slice(-6).map((m) => ({
                    role: m.sender_id === me?.id ? "assistant" : "user",
                    content: m.content,
                    sender_name: m.sender_name,
                  }))}
                  onUseSuggestion={(text) => setInput(text)}
                />
              )}
              <TypingIndicator label={typingLabel} />
              <div className="flex gap-3">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  sendTyping();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) send();
                }}
                placeholder="Type a message"
              />
              <Button onClick={send} disabled={!input.trim() || connecting} className="px-4">
                <Icon name="send" className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
