"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton, StatusBadge, Toast } from "@/components/common/UI";
import { StaleIssuesBanner } from "@/components/common/StaleIssuesBanner";

type Issue = { id: string; title: string; status: string; description: string };

const columns = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

export default function AuthorityIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    const r = await api.get<Issue[]>("/issues/");
    setIssues(r.data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: string) {
    await api.put(`/issues/${id}/status`, { status });
    await refresh();
    setToast(`Issue moved to ${status.replace("_", " ")}`);
    setTimeout(() => setToast(null), 2400);
  }

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        issues: issues.filter((issue) => issue.status === column.key),
      })),
    [issues]
  );

  return (
    <AuthGuard roles={["authority"]}>
      <DashboardShell title="Assigned issues">
        <StaleIssuesBanner />
        {toast && <Toast message={toast} />}
        {loading ? (
          <Card>
            <LoadingSkeleton rows={4} />
          </Card>
        ) : issues.length === 0 ? (
          <Card>
            <EmptyState icon="issue" title="No visible issues" text="Assigned issue cards will show up here as open, in progress, or resolved." />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {grouped.map((column) => (
              <section key={column.key} className="rounded-3xl border border-white/70 bg-white/[0.72] p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase text-slate-500">{column.label}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{column.issues.length}</span>
                </div>
                <div className="space-y-3">
                  {column.issues.map((issue) => (
                    <article key={issue.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-brand">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black text-slate-950">{issue.title}</h3>
                        <StatusBadge status={issue.status} />
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{issue.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setStatus(issue.id, "in_progress")}>
                          In progress
                        </Button>
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setStatus(issue.id, "resolved")}>
                          Resolved
                        </Button>
                        <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setStatus(issue.id, "closed")}>
                          Closed
                        </Button>
                      </div>
                    </article>
                  ))}
                  {column.issues.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
                      Nothing here
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}
