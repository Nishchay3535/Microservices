"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton, StatusBadge, Toast } from "@/components/common/UI";

type Session = {
  id: string;
  topic: string;
  status: string;
  employee_id: string;
};

function MentorSchedulePageContent() {
  const searchParams = useSearchParams();
  const menteeId = useMemo(
    () => searchParams.get("mentee") ?? searchParams.get("menteeId") ?? undefined,
    [searchParams]
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const filteredSessions = sessions.filter((session) => session.employee_id === menteeId);

  useEffect(() => {
    if (!menteeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<Session[]>("/mentorship/sessions")
      .then((response) => setSessions(response.data))
      .catch((error) => {
        console.error("Failed to load mentorship sessions", error);
        setToast("Unable to load schedule info. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [menteeId]);

  const refresh = async () => {
    if (!menteeId) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<Session[]>("/mentorship/sessions");
      setSessions(response.data);
    } catch (error) {
      console.error("Unable to refresh mentorship sessions", error);
      setToast("Unable to refresh schedule data.");
    } finally {
      setLoading(false);
    }
  };

  const claimSession = async (sessionId: string) => {
    await api.put(`/mentorship/sessions/${sessionId}`, { status: "active" });
    setToast("Session activated.");
    await refresh();
    window.setTimeout(() => setToast(null), 2400);
  };

  const completeSession = async (sessionId: string) => {
    await api.put(`/mentorship/sessions/${sessionId}`, { status: "completed" });
    setToast("Session marked complete.");
    await refresh();
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Mentee schedule">
        {toast && <Toast message={toast} />}
        <Card>
          {!menteeId ? (
            <EmptyState
              icon="mentor"
              title="No mentee selected"
              text="Choose a mentee from the roster to view and manage their session requests."
            />
          ) : loading ? (
            <LoadingSkeleton rows={5} />
          ) : filteredSessions.length === 0 ? (
            <>
              <EmptyState
                icon="mentor"
                title="No scheduled sessions"
                text="This mentee has no mentorship requests yet. You can open chat to coordinate a follow-up."
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
                  <h2 className="text-xl font-black text-slate-950">Session requests</h2>
                  <p className="text-sm text-slate-500">Manage mentorship requests for this mentee.</p>
                </div>
                <Link href="/mentor">
                  <Button variant="outline">Back to dashboard</Button>
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredSessions.map((session) => (
                  <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{session.topic}</h3>
                        <p className="mt-2 text-sm text-slate-500">Request for mentee ID {session.employee_id}</p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.status === "requested" ? (
                        <Button className="px-3 py-2 text-xs" onClick={() => void claimSession(session.id)}>
                          Activate session
                        </Button>
                      ) : null}
                      {session.status === "active" ? (
                        <Button className="px-3 py-2 text-xs" onClick={() => void completeSession(session.id)}>
                          Mark complete
                        </Button>
                      ) : null}
                    </div>
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

export default function MentorSchedulePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MentorSchedulePageContent />
    </Suspense>
  );
}
