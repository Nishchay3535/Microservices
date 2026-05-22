"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ConversationChat } from "@/components/chat/ConversationChat";
import { DashboardShell } from "@/components/layout/DashboardShell";

function MentorChatPageContent() {
  const searchParams = useSearchParams();
  const menteeId = useMemo(() => searchParams.get("menteeId") ?? undefined, [searchParams]);

  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Employee Chats">
        <ConversationChat
          mode="participant"
          roomType="mentor"
          initialOtherUserId={menteeId}
          emptyText="No employee chats yet. Employees will appear here after they open a mentor room."
        />
      </DashboardShell>
    </AuthGuard>
  );
}

export default function MentorChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MentorChatPageContent />
    </Suspense>
  );
}
