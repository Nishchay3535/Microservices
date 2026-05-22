"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { ConversationChat } from "@/components/chat/ConversationChat";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function EmployeeMentorChatPage() {
  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Mentor chat">
        <ConversationChat
          mode="employee"
          roomType="mentor"
          directoryEndpoint="/users/mentors"
          emptyText="No active mentors are available."
        />
      </DashboardShell>
    </AuthGuard>
  );
}
