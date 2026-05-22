"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Card, EmptyState, LoadingSkeleton, SeverityPill, StatusBadge } from "@/components/common/UI";

type Issue = {
  id: string;
  title: string;
  status: string;
  severity: number;
  is_anonymous: boolean;
  created_at: string;
};

export default function MyIssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Issue[]>("/issues/").then((r) => setIssues(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="My issues">
        <Card>
          {loading && <LoadingSkeleton rows={4} />}
          {!loading && issues.length === 0 && (
            <EmptyState icon="issue" title="No issues yet" text="When you submit an issue, its status, severity, and privacy mode will appear here." />
          )}
          {!loading && issues.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {issues.map((issue) => (
                <article
                  key={issue.id}
                  className="group rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-slate-950">{issue.title}</h3>
                    <StatusBadge status={issue.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SeverityPill value={issue.severity} />
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {issue.is_anonymous ? "Anonymous" : "Identified"}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-slate-400">{new Date(issue.created_at).toLocaleString()}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push(`/employee/ai-chat/${issue.id}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #FF55B8, #a855f7)" }}
                    >
                      Talk to AI Support
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}
