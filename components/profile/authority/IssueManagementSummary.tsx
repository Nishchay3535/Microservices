"use client";

import { useMemo } from "react";
import { Card } from "@/components/common/UI";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { IssueManagementSummaryProps } from "@/types/profile";

const colors: Record<string, string> = { open: "#0ea5e9", in_progress: "#f59e0b", resolved: "#10b981", escalated: "#ef4444" };

export function IssueManagementSummary({ issues, stats, onUpdateStatus }: IssueManagementSummaryProps) {
  const chartData = useMemo(
    () => stats.map((item) => ({ name: item.name, value: item.value, fill: colors[item.name.toLowerCase().replace(" ", "_")] ?? "#818cf8" })),
    [stats]
  );

  const total = stats.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Issue management</h2>
              <p className="text-sm text-slate-500">Current workload and recent issue updates.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{total} assigned</div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius={60} outerRadius={90} stroke="transparent">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-slate-950 text-xl font-black">
                  {total}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {issues.slice(0, 3).map((issue) => (
            <div key={issue.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{issue.title}</p>
                  <p className="mt-1 text-sm text-slate-500">Assigned to {issue.assigned_to ?? "unassigned"}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{issue.status.replace("_", " ")}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Updated {new Date(issue.updated_at).toLocaleDateString()}</p>
                <select
                  onChange={(event) => onUpdateStatus(issue.id, event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                  defaultValue={issue.status}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
