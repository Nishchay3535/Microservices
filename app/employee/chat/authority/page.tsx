"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { ConversationChat } from "@/components/chat/ConversationChat";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function EmployeeAuthorityChatPage() {
  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Authority chat">
        <ConversationChat
          mode="employee"
          roomType="authority"
          directoryEndpoint="/users/authorities"
          emptyText="No active authorities are available."
        />
      </DashboardShell>
    </AuthGuard>
  );
}
