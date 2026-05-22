"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Icon } from "@/components/common/Icons";
import { api, setAuthToken } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Issue = {
  id: string;
  title: string;
  category: string;
  status: string;
  severity: number;
  created_at: string;
};

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const openingMessage =
  "Hi, I'm Aria. I'm here with you. Tell me what this has been like for you, and we can take it one step at a time.";

const prompts = [
  "I feel stressed about this",
  "Help me explain what happened",
  "What should I do next?",
];

function getErrorMessage(error: unknown) {
  const detail = (error as ApiError).response?.data?.detail;
  if (detail) return detail;
  return "I could not reach the AI service. Check that the backend is running and your API key is configured.";
}

function formatStatus(value?: string) {
  if (!value) return "Open";
  return value.replaceAll("_", " ");
}

export default function AIChatPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [issueLoading, setIssueLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: openingMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const canSend = input.trim().length > 0 && !loading;
  const issueMeta = useMemo(() => {
    if (!issue) return [];
    return [
      { label: "Category", value: issue.category },
      { label: "Status", value: formatStatus(issue.status) },
      { label: "Severity", value: String(issue.severity) },
    ];
  }, [issue]);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  useEffect(() => {
    let alive = true;

    async function loadIssue() {
      setIssueLoading(true);
      try {
        const res = await api.get<Issue>(`/issues/${issueId}`);
        if (alive) setIssue(res.data);
      } catch {
        if (alive) setError("Could not load this issue context.");
      } finally {
        if (alive) setIssueLoading(false);
      }
    }

    void loadIssue();
    return () => {
      alive = false;
    };
  }, [issueId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, error]);

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post<{ reply: string }>("/ai-chat/message", {
        issue_id: issueId,
        messages: updatedMessages,
      });
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard roles={["employee"]}>
      <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
        <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand/40 hover:text-brand"
                aria-label="Go back"
              >
                <Icon name="chevronRight" className="h-4 w-4 rotate-180" />
              </button>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-sm font-black text-white shadow-brand">
                AI
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-black">Aria</p>
                <p className="text-xs font-bold text-emerald-600">AI Support Companion - confidential</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/employee/issues")}
              className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand/40 hover:text-brand sm:inline-flex"
            >
              My issues
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-brand">Issue context</p>
              {issueLoading ? (
                <div className="mt-4 space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                </div>
              ) : issue ? (
                <>
                  <h1 className="mt-3 text-2xl font-black leading-tight">{issue.title}</h1>
                  <div className="mt-5 grid gap-2">
                    {issueMeta.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="text-xs font-bold text-slate-500">{item.label}</span>
                        <span className="text-xs font-black capitalize text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm font-bold text-rose-600">Issue context is unavailable.</p>
              )}
            </section>

            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-black text-emerald-900">A calm place to talk</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Aria can help you sort through feelings, prepare what to say, and think about next steps.
              </p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">
                Not a substitute for HR, medical, legal, or emergency support.
              </p>
            </section>
          </aside>

          <section className="flex min-h-[calc(100vh-150px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            <div className="border-b border-slate-100 bg-gradient-to-r from-white via-pink-50 to-sky-50 px-5 py-4">
              <p className="text-sm font-black text-slate-900">Support conversation</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Private AI chat for this issue</p>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-6">
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={`${msg.role}-${index}`} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-xs font-black text-white">
                          AI
                        </span>
                      )}
                      <div
                        className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isUser
                            ? "rounded-br-md bg-brand text-white"
                            : "rounded-bl-md border border-slate-100 bg-white text-slate-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start gap-3">
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-xs font-black text-white">
                      AI
                    </span>
                    <div className="rounded-3xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex h-5 items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              <div className="mx-auto max-w-3xl">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      disabled={loading}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-2 focus-within:border-brand/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/10">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Share what's on your mind..."
                    rows={1}
                    className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!canSend}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-black text-white shadow-brand transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
