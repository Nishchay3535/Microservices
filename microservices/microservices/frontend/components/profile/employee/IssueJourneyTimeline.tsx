"use client";

import { useState } from "react";
import { Icon } from "@/components/common/Icons";
import type { IssueJourneyTimelineProps } from "@/types/profile";

const statusSteps = [
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under review" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "resolved":
      return "bg-emerald-500 text-white";
    case "in_progress":
      return "bg-amber-500 text-white";
    case "under_review":
      return "bg-sky-500 text-white";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export function IssueJourneyTimeline({ issues }: IssueJourneyTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Issue journey</h2>
          <p className="text-sm text-slate-500">Track your submitted issues from start to resolution.</p>
        </div>
      </div>

      <div className="space-y-4">
        {issues.map((issue) => {
          const activeIndex = statusSteps.findIndex((step) => step.id === issue.status);
          return (
            <div key={issue.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <button type="button" onClick={() => setExpanded(expanded === issue.id ? null : issue.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-slate-950">{issue.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                      <span>Updated {new Date(issue.updated_at).toLocaleDateString()}</span>
                      <span>{issue.assigned_authority || "Unassigned"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusColor(issue.status)}`}>{issue.status.replace("_", " ")}</span>
                    <Icon name={expanded === issue.id ? "chevronRight" : "chevronRight"} className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </button>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {statusSteps.map((step, index) => {
                    const active = index <= activeIndex;
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {index + 1}
                        </div>
                        <span className={`text-xs font-bold uppercase ${active ? "text-slate-900" : "text-slate-500"}`}>{step.label}</span>
                        {index < statusSteps.length - 1 ? <span className="h-0.5 w-8 bg-slate-200" /> : null}
                      </div>
                    );
                  })}
                </div>
                {expanded === issue.id ? (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>{issue.snippet}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Assigned authority</p>
                    <p className="mt-1 text-sm text-slate-700">{issue.assigned_authority || "Not assigned yet"}</p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
