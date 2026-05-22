"use client";

import { Icon } from "@/components/common/Icons";
import { Card } from "@/components/common/UI";
import type { MentorConnectionCardProps } from "@/types/profile";

const availabilityColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-slate-300",
  busy: "bg-amber-400",
};

export function MentorConnectionCard({ mentor, sessions, onMessageMentor, onRequestSession }: MentorConnectionCardProps) {
  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Mentor connection</h2>
              <p className="text-sm text-slate-500">Your current mentorship support and recent sessions.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{mentor ? mentor.availability : "No mentor"}</div>
          </div>

          {mentor ? (
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-xl font-black text-white">
                {mentor.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-slate-950">{mentor.full_name}</p>
                <p className="mt-1 text-sm text-slate-500">{mentor.specialization}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <span className={`inline-flex h-2.5 w-2.5 rounded-full ${availabilityColors[mentor.availability]}`} />
                  {mentor.availability === "online" ? "Available now" : mentor.availability === "busy" ? "Busy" : "Offline"}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No mentor is currently assigned. Request a new session to connect.</div>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onMessageMentor} disabled={!mentor} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              <Icon name="chat" className="h-4 w-4" />
              Message mentor
            </button>
            <button type="button" onClick={onRequestSession} className="rounded-3xl bg-rose-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-400">
              <Icon name="plus" className="h-4 w-4" />
              Request new session
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Session history</p>
          <div className="mt-4 space-y-3">
            {sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">{session.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{session.date} · {session.status}</p>
              </div>
            ))}
            {!sessions.length ? <p className="text-sm text-slate-500">No sessions yet.</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
