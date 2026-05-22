"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CreateResourceForm } from "@/components/resources/CreateResourceForm";

export default function MentorLearnPage() {
  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Learning hub">
        <p className="mb-6 text-sm leading-6 text-slate-600">
          Add mentoring resources and learning materials. Employees will see them in the Learning hub.
        </p>
        <CreateResourceForm />
      </DashboardShell>
    </AuthGuard>
  );
}
