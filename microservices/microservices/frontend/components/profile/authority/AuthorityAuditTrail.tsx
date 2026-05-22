"use client";

import { Card } from "@/components/common/UI";
import type { AuthorityAuditTrailProps } from "@/types/profile";

const actionIcons: Record<string, string> = {
  login: "bg-sky-100 text-sky-700",
  update: "bg-amber-100 text-amber-700",
  delete: "bg-rose-100 text-rose-700",
  review: "bg-emerald-100 text-emerald-700",
  access: "bg-slate-100 text-slate-700",
};

export function AuthorityAuditTrail({ entries }: AuthorityAuditTrailProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Audit trail</h2>
          <p className="text-sm text-slate-500">Recent actions you performed in the system.</p>
        </div>
        <a href="/admin/audit-logs" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
          View full audit log
        </a>
      </div>

      <div className="mt-5 space-y-3">
        {entries.slice(0, 5).map((entry) => (
          <div key={entry.id} className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className={`mt-1 inline-flex h-10 w-10 items-center justify-center rounded-3xl ${actionIcons[entry.type] ?? "bg-slate-100 text-slate-700"}`}>
              <span className="text-sm font-black">{entry.type.slice(0, 1).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-950">{entry.description}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                <span>{entry.ip}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
