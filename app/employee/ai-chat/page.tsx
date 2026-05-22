"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton } from "@/components/common/UI";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";

type Issue = {
  id: string;
  title: string;
  created_at: string;
};

export default function EmployeeAIChatIndexPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadIssues() {
      try {
        const res = await api.get<Issue[]>("/issues/");
        if (!alive) return;
        const nextIssues = res.data;
        setIssues(nextIssues);
        if (nextIssues.length > 0) {
          router.replace(`/employee/ai-chat/${nextIssues[0].id}`);
        }
      } catch {
        if (alive) setError("Unable to load your issues right now.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadIssues();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="AI Support">
        <Card>
          {loading && <LoadingSkeleton rows={4} />}
          {!loading && error && <p className="text-sm font-bold text-rose-600">{error}</p>}
          {!loading && !error && issues.length === 0 && (
            <div className="space-y-5">
              <EmptyState
                icon="spark"
                title="Submit an issue first"
                text="Aria uses your issue details to give support that is specific to your situation."
              />
              <div className="flex justify-center">
                <Link href="/employee/submit">
                  <Button>Submit issue</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}
