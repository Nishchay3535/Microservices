"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CreateResourceForm } from "@/components/resources/CreateResourceForm";

export default function AuthorityLearnPage() {
  return (
    <AuthGuard roles={["authority"]}>
      <DashboardShell title="Learning hub">
        <p className="mb-6 text-sm leading-6 text-slate-600">
          Publish articles, videos, and guides. Employees will find them in the Learning hub.
        </p>
        <CreateResourceForm />
      </DashboardShell>
    </AuthGuard>
  );
}
