"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton, StatusBadge, Toast } from "@/components/common/UI";

type Session = { id: string; topic: string; status: string };

export default function MentorRequestsPage() {
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    const r = await api.get<Session[]>("/mentorship/sessions");
    setRows(r.data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function claim(id: string) {
    await api.put(`/mentorship/sessions/${id}`, { status: "active" });
    await refresh();
    setToast("Session activated");
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Support requests">
        {toast && <Toast message={toast} />}
        <Card>
          {loading && <LoadingSkeleton rows={4} />}
          {!loading && rows.length === 0 && <EmptyState icon="heart" title="No sessions" text="Mentorship requests will appear here when employees ask for support." />}
          {!loading && rows.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {rows.map((session) => (
                <article key={session.id} className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-emerald-50 p-5 transition hover:-translate-y-1 hover:shadow-brand">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-slate-950">{session.topic}</h3>
                    <StatusBadge status={session.status} />
                  </div>
                  {session.status === "requested" && (
                    <Button variant="outline" className="mt-5 text-xs" onClick={() => void claim(session.id)}>
                      Claim / activate
                    </Button>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}
