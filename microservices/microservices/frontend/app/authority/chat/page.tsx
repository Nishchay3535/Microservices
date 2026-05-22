"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { ConversationChat } from "@/components/chat/ConversationChat";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AuthorityChatPage() {
  return (
    <AuthGuard roles={["authority"]}>
      <DashboardShell title="Employee Chats">
        <ConversationChat
          mode="participant"
          roomType="authority"
          emptyText="No employee chats yet. Employees will appear here after they open an authority room."
          showAIAssist={true}
        />
      </DashboardShell>
    </AuthGuard>
  );
}
