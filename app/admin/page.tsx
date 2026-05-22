"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card, StatCard } from "@/components/common/UI";

export default function AdminHome() {
  return (
    <AuthGuard roles={["admin"]}>
      <DashboardShell title="Admin console">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="User operations" value="Live" icon="users" trend="Role controls" tone="blue" />
            <StatCard label="Analytics" value="Open" icon="analytics" trend="Current totals" tone="pink" />
            <StatCard label="Audit trail" value="On" icon="audit" trend="Traceable" tone="green" />
          </div>
          <Card>
            <h2 className="text-2xl font-black text-slate-950">Platform control room</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Manage users, inspect audit logs, and monitor platform analytics from one clean workspace.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/users">
                <Button variant="outline">Users</Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline">Analytics</Button>
              </Link>
              <Link href="/admin/audit-logs">
                <Button variant="outline">Audit logs</Button>
              </Link>
            </div>
          </Card>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
