"use client";

import { useState } from "react";
import { api, setAuthToken } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

interface RecentMessage {
  role: string;
  content: string;
  sender_name?: string;
}

interface Props {
  issueId: string | null;
  employeeId?: string | null;
  recentMessages: RecentMessage[];
  onUseSuggestion: (text: string) => void;
}

export default function AISuggestedReply({ issueId, employeeId, recentMessages, onUseSuggestion }: Props) {
  const token = useAuthStore((s) => s.token);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  async function fetchSuggestion() {
    if (token) setAuthToken(token);
    setLoading(true);
    setVisible(true);
    try {
      const res = await api.post<{ suggested_reply: string }>("/ai-authority-assist/suggest", {
        issue_id: issueId,
        employee_id: employeeId,
        recent_messages: recentMessages.slice(-6),
      });
      setSuggestion(res.data.suggested_reply);
    } catch {
      setSuggestion("Could not generate a suggestion right now.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => void fetchSuggestion()}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80"
        style={{ borderColor: "#FF55B8", color: "#FF55B8" }}
      >
        AI Suggest Reply
      </button>
    );
  }

  return (
    <div
      className="rounded-xl border p-3 mb-2 bg-gradient-to-r from-pink-50 to-purple-50"
      style={{ borderColor: "#FF55B8" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: "#FF55B8" }}>
          AI Suggested Reply
        </span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-xs leading-none"
        >
          x
        </button>
      </div>

      {loading ? (
        <div className="flex gap-1 py-2">
          <span
            className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{suggestion}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (suggestion) onUseSuggestion(suggestion);
                setVisible(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: "linear-gradient(135deg, #FF55B8, #a855f7)" }}
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => void fetchSuggestion()}
              className="text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50"
            >
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
}
