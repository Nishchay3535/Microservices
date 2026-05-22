"use client";

import { Card } from "@/components/common/UI";
import type { SessionCalendarWidgetProps } from "@/types/profile";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SessionCalendarWidget({ sessions, onMarkComplete }: SessionCalendarWidgetProps) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const sessionDays = new Set(sessions.map((session) => new Date(session.date).getDate()));

  return (
    <Card>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Session calendar</h2>
              <p className="text-sm text-slate-500">This month’s scheduled mentoring sessions.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{now.toLocaleString("default", { month: "long" })}</div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-500">
            {weekdays.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2 text-sm">
            {Array.from({ length: firstOfMonth.getDay() }).map((_, index) => (
              <div key={`blank-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const isSession = sessionDays.has(day);
              return (
                <div key={day} className="group relative rounded-3xl border border-slate-200 bg-slate-50 p-2 text-center">
                  <div className="font-semibold text-slate-800">{day}</div>
                  {isSession ? <span className="absolute bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-rose-500" /> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming sessions</p>
            <div className="mt-4 space-y-3">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="font-black text-slate-950">{session.mentee_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{session.date} • {session.time} • {session.type}</p>
                  <button type="button" onClick={() => onMarkComplete(session.id)} className="mt-3 inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
                    Mark complete
                  </button>
                </div>
              ))}
              {!sessions.length ? <p className="text-sm text-slate-500">No upcoming sessions this month.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
