"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Card, LoadingSkeleton, StatCard } from "@/components/common/UI";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<{ users: number; issues: number } | null>(null);

  useEffect(() => {
    api.get("/admin/analytics").then((r) => setData(r.data));
  }, []);

  return (
    <AuthGuard roles={["admin"]}>
      <DashboardShell title="Analytics">
        {!data ? (
          <Card>
            <LoadingSkeleton rows={2} />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Users" value={data.users} icon="users" trend="Registered accounts" tone="blue" />
            <StatCard label="Issues" value={data.issues} icon="issue" trend="Tracked reports" tone="pink" />
          </div>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}
