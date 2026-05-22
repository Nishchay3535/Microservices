"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CreateResourceForm } from "@/components/resources/CreateResourceForm";

export default function AdminResourcesPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <DashboardShell title="Manage Learning Resources">
        <CreateResourceForm />
      </DashboardShell>
    </AuthGuard>
  );
}
