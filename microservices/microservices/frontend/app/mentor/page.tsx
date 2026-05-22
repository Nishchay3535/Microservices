"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card, IconBubble, StatCard } from "@/components/common/UI";

export default function MentorHome() {
  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Mentor dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/mentor/requests" className="block">
              <StatCard label="Support requests" value="New" icon="heart" trend="Ready to claim" tone="green" />
            </Link>
            <Link href="/mentor/chat" className="block">
              <StatCard label="Active chats" value="Live" icon="chat" trend="Private" tone="blue" />
            </Link>
            <Link href="/mentor/requests" className="block">
              <StatCard label="Escalation path" value="Clear" icon="shield" trend="Authority linked" tone="pink" />
            </Link>
          </div>
          <Card className="bg-gradient-to-br from-white to-emerald-50">
            <IconBubble icon="mentor" className="text-emerald-600" />
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Make support feel immediate and human.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Support employees with empathy, claim requests, and escalate severe cases to higher authority when needed.
            </p>
            <Link href="/mentor/requests" className="mt-6 inline-block">
              <Button>View requests</Button>
            </Link>
          </Card>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
