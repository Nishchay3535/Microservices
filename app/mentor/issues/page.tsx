"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton, StatusBadge, Toast } from "@/components/common/UI";

type Issue = {
  id: string;
  title: string;
  status: string;
  severity: number;
  is_anonymous: boolean;
  created_at: string;
  description: string;
};

function MentorIssuesPageContent() {
  const searchParams = useSearchParams();
  const menteeId = useMemo(
    () => searchParams.get("mentee") ?? searchParams.get("menteeId") ?? undefined,
    [searchParams]
  );
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!menteeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<Issue[]>(`/issues/?mentee=${encodeURIComponent(menteeId)}`)
      .then((response) => setIssues(response.data))
      .catch((error) => {
        console.error("Failed to load mentee issues", error);
        setToast("Unable to load issues for this mentee. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [menteeId]);

  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Mentee issues">
        {toast && <Toast message={toast} />}
        <Card>
          {!menteeId ? (
            <EmptyState
              icon="issue"
              title="No mentee selected"
              text="Return to the mentor roster and select a mentee to view their issue history."
            />
          ) : loading ? (
            <LoadingSkeleton rows={5} />
          ) : issues.length === 0 ? (
            <>
              <EmptyState
                icon="issue"
                title="No issues found"
                text="This mentee has no accessible issues yet. Try checking back after they submit one."
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href={`/mentor/chat?menteeId=${encodeURIComponent(menteeId)}`}>
                  <Button>Open chat</Button>
                </Link>
                <Link href="/mentor">
                  <Button variant="outline">Back to dashboard</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Issues for mentee</h2>
                  <p className="text-sm text-slate-500">Review the active issues submitted by this mentee.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/mentor/chat?menteeId=${encodeURIComponent(menteeId)}`}>
                    <Button>Open chat</Button>
                  </Link>
                  <Link href="/mentor">
                    <Button variant="outline">Back to dashboard</Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {issues.map((issue) => (
                  <article key={issue.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{issue.title}</h3>
                        <p className="mt-2 text-sm text-slate-500 line-clamp-3">{issue.description}</p>
                      </div>
                      <StatusBadge status={issue.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Severity: {issue.severity}</span>
                      <span>{issue.is_anonymous ? "Anonymous" : "Identified"}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">Submitted {new Date(issue.created_at).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}

export default function MentorIssuesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MentorIssuesPageContent />
    </Suspense>
  );
}
