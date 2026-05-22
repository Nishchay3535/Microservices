"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CreatePollForm } from "@/components/polls/CreatePollForm";

export default function AuthorityPollsPage() {
  return (
    <AuthGuard roles={["authority"]}>
      <DashboardShell title="Polls">
        <p className="mb-6 text-sm leading-6 text-slate-600">
          Create pulse surveys for your team. Employees see active polls on their Polls page and can vote once.
        </p>
        <CreatePollForm />
      </DashboardShell>
    </AuthGuard>
  );
}
