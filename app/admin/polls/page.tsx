"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CreatePollForm } from "@/components/polls/CreatePollForm";

export default function AdminPollsPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <DashboardShell title="Create Poll">
        <CreatePollForm />
      </DashboardShell>
    </AuthGuard>
  );
}
