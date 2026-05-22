"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Card, EmptyState, LoadingSkeleton } from "@/components/common/UI";

type Log = { id: string; action: string; target_type: string; created_at: string };

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Log[]>("/admin/audit-logs").then((r) => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard roles={["admin"]}>
      <DashboardShell title="Audit logs">
        <Card>
          {loading && <LoadingSkeleton rows={5} />}
          {!loading && logs.length === 0 && <EmptyState icon="audit" title="No audit entries" text="Platform actions will appear here as a traceable timeline." />}
          {!loading && logs.length > 0 && (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-black text-brand">{log.action}</p>
                    <p className="text-xs font-semibold text-slate-500">{log.target_type}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}
