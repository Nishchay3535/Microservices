"use client";

import { Card } from "@/components/common/UI";
import type { MenteeRosterProps } from "@/types/profile";

export function MenteeRoster({ mentees, helpCount, resolvedIssues, onViewIssues, onOpenChat, onScheduleSession }: MenteeRosterProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Mentee roster</h2>
            <p className="text-sm text-slate-500">Your active mentees and quick actions for each case.</p>
          </div>
          <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            You have helped {helpCount} employees resolve {resolvedIssues} issues
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentees.map((mentee) => (
            <div key={mentee.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-xl font-black text-white">
                  {mentee.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black text-slate-950">{mentee.full_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{mentee.issues_count} issues</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Last session: {mentee.last_session_at ? new Date(mentee.last_session_at).toLocaleDateString() : "None"}</p>
                <p>Status: <span className="font-semibold text-slate-900">{mentee.session_status}</span></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onViewIssues(mentee.id)} className="rounded-3xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800">View issues</button>
                <button type="button" onClick={() => onOpenChat(mentee.id)} className="rounded-3xl bg-sky-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-400">Open chat</button>
                <button type="button" onClick={() => onScheduleSession(mentee.id)} className="rounded-3xl bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-400">Schedule session</button>
              </div>
            </div>
          ))}
          {!mentees.length ? <p className="text-sm text-slate-500">No active mentees yet.</p> : null}
        </div>
      </div>
    </Card>
  );
}
