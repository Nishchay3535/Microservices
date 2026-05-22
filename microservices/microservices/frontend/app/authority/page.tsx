"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card, IconBubble, StatCard } from "@/components/common/UI";

export default function AuthorityHome() {
  return (
    <AuthGuard roles={["authority"]}>
      <DashboardShell title="Authority dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/authority/issues" className="block">
              <StatCard label="Assigned queue" value="Live" icon="issue" trend="Triage ready" tone="pink" />
            </Link>
            <Link href="/authority/chat" className="block">
              <StatCard label="Open chats" value="24/7" icon="chat" trend="Realtime" tone="blue" />
            </Link>
            <Link href="/authority/issues" className="block">
              <StatCard label="Decision aid" value="AI" icon="spark" trend="Human review" tone="amber" />
            </Link>
          </div>
          <Card className="bg-gradient-to-br from-white to-brand-soft/50">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <IconBubble icon="shield" />
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Resolve with context, not guesswork.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Review assigned issues, respond in real time, and use AI insights as decision support while keeping the final judgment human.
                </p>
              </div>
              <Link href="/authority/issues">
                <Button className="w-full lg:w-auto">View issues</Button>
              </Link>
            </div>
          </Card>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
