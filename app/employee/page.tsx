"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card, Icon, IconBubble, StatCard } from "@/components/common/UI";
import { KudosLeaderboard } from "@/components/profile/KudosLeaderboard";
import { api } from "@/lib/api/client";

const actions = [
  { href: "/employee/submit", label: "Submit issue", icon: "plus" as const },
  { href: "/employee/ai-chat", label: "AI Support", icon: "spark" as const },
  { href: "/employee/checkin", label: "Weekly check-in", icon: "activity" as const },
  { href: "/employee/learn", label: "Learning hub", icon: "spark" as const },
  { href: "/employee/chat/authority", label: "Authority chat", icon: "shield" as const },
  { href: "/employee/chat/mentor", label: "Mentor chat", icon: "chat" as const },
];

type IssueRow = { id: string; status: string };

export default function EmployeeHome() {
  const [openPaths, setOpenPaths] = useState<number | null>(null);
  const [chatThreads, setChatThreads] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [issuesRes, authRooms, mentorRooms] = await Promise.all([
          api.get<IssueRow[]>("/issues/"),
          api.get<unknown[]>(`/chat/rooms?room_type=authority`),
          api.get<unknown[]>(`/chat/rooms?room_type=mentor`),
        ]);
        if (!alive) return;
        const issues = issuesRes.data;
        const open = issues.filter((i) => i.status === "open" || i.status === "in_progress").length;
        setOpenPaths(open);
        setChatThreads(authRooms.data.length + mentorRooms.data.length);
      } catch {
        if (!alive) return;
        setOpenPaths(null);
        setChatThreads(null);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const openLabel = openPaths === null ? "—" : String(openPaths);
  const chatLabel = chatThreads === null ? "—" : String(chatThreads);

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Employee dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/employee/issues" className="block">
              <StatCard
                label="Active support issues"
                value={openLabel}
                icon="issue"
                trend={openPaths === null ? "Loading…" : "Open or in progress"}
                tone="pink"
              />
            </Link>
            <Link href="/employee/chat/authority" className="block">
              <StatCard
                label="Chat threads"
                value={chatLabel}
                icon="chat"
                trend={chatThreads === null ? "Loading…" : "Authority + mentor"}
                tone="blue"
              />
            </Link>
            <Link href="/public" className="block">
              <StatCard label="Community signal" value="Live" icon="board" trend="Public board" tone="green" />
            </Link>
          </div>

          <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-lg shadow-emerald-100/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase text-emerald-700">Wellbeing &amp; growth</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Small habits, safer workplaces</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Take a two-minute weekly pulse, recognize teammates on the kudos wall, and pick up a short learning module—built
                  for IT teams balancing delivery pressure with psychological safety.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/employee/checkin">
                  <Button className="whitespace-nowrap">Check in</Button>
                </Link>
                <Link href="/kudos">
                  <Button variant="outline" className="whitespace-nowrap">
                    Send kudos
                  </Button>
                </Link>
                <Link href="/employee/learn">
                  <Button variant="ghost" className="whitespace-nowrap text-slate-800">
                    Learn
                  </Button>
                </Link>
                <Link href="/employee/polls">
                  <Button variant="ghost" className="whitespace-nowrap text-slate-800">
                    Polls
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="overflow-hidden bg-slate-950 p-0 text-white">
              <div className="relative bg-slate-950 p-7">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
                <div className="relative">
                  <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-brand">
                    Confidential first
                  </p>
                  <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-white">
                    Raise an issue safely, then stay connected until it moves.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">
                    Submit anonymously or with identity, track the resolution path, and keep separate support conversations with
                    an authority or mentor.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/employee/submit">
                      <Button>Submit issue</Button>
                    </Link>
                    <Link href="/public">
                      <Button variant="ghost" className="text-white hover:bg-white/10">
                        View public board
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">Quick actions</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Next best step</h2>
                </div>
                <IconBubble icon="spark" />
              </div>
              <div className="mt-5 grid gap-3">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:shadow-brand"
                  >
                    <span className="flex items-center gap-3 text-sm font-black text-slate-800">
                      <IconBubble icon={action.icon} className="h-10 w-10 rounded-2xl" />
                      {action.label}
                    </span>
                    <Icon name="chevronRight" className="h-4 w-4 text-slate-400 group-hover:text-brand" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <KudosLeaderboard />

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Recent activity</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Workspace pulse</h2>
              </div>
              <IconBubble icon="activity" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                "Issue drafts stay private until you submit them",
                "Weekly check-ins help spot burnout early—only you see your raw scores",
                "Kudos and learning completions gently grow your impact score over time",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-bold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
