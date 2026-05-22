"use client";

import { Card } from "@/components/common/UI";
import type { DepartmentHealthScoreProps } from "@/types/profile";

const statusColors: Record<string, string> = {
  up: "text-emerald-600 bg-emerald-100",
  down: "text-rose-600 bg-rose-100",
  steady: "text-slate-600 bg-slate-100",
};

export function DepartmentHealthScore({ score }: DepartmentHealthScoreProps) {
  const healthColor = score.score >= 75 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : score.score >= 50 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-rose-300 bg-rose-50 text-rose-700";

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Department health score</h2>
              <p className="text-sm text-slate-500">A single score that reflects team wellbeing and response quality.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${score.score >= 75 ? "bg-emerald-100 text-emerald-700" : score.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>Score</span>
          </div>

          <div className="mt-8 flex items-center gap-6">
            <div className={`flex h-36 w-36 items-center justify-center rounded-full border-8 ${healthColor}`}>
              <div className="text-center">
                <p className="text-5xl font-black">{score.score}</p>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">/ 100</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Issue resolution speed</p>
                <p className="mt-2 text-lg font-black text-slate-950">{score.resolutionSpeed}%</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Employee engagement</p>
                <p className="mt-2 text-lg font-black text-slate-950">{score.engagement}%</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Response rate</p>
                <p className="mt-2 text-lg font-black text-slate-950">{score.responseRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${statusColors[score.trend]}`}> 
            {score.trend === "up" ? "+" : score.trend === "down" ? "−" : "="} Trend {score.trend}
          </div>
          <div className="mt-6 text-sm leading-6 text-slate-600">
            <p>Compared to last month, your department’s health score is {score.trend === "up" ? "improving" : score.trend === "down" ? "declining" : "steady"}.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
