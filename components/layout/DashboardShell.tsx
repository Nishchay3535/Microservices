"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAuthStore, type Role } from "@/store/authStore";
import { Button } from "@/components/common/Button";
import { api, setAuthToken } from "@/lib/api/client";
import { Icon, type IconName } from "@/components/common/Icons";

const nav: Record<Role, { href: string; label: string; icon: IconName }[]> = {
  employee: [
    { href: "/employee", label: "Home", icon: "home" },
    { href: "/employee/submit", label: "Submit issue", icon: "plus" },
    { href: "/employee/issues", label: "My issues", icon: "issue" },
    { href: "/employee/ai-chat", label: "AI Support", icon: "spark" },
    { href: "/employee/checkin", label: "Weekly check-in", icon: "activity" },
    { href: "/employee/learn", label: "Learning hub", icon: "spark" },
    { href: "/kudos", label: "Kudos", icon: "heart" },
    { href: "/employee/polls", label: "Polls", icon: "flag" },
    { href: "/employee/chat/authority", label: "Authority chat", icon: "shield" },
    { href: "/employee/chat/mentor", label: "Mentor chat", icon: "chat" },
    { href: "/public", label: "Public board", icon: "board" },
    { href: "/profile", label: "Profile", icon: "user" },
  ],
  authority: [
    { href: "/authority", label: "Dashboard", icon: "dashboard" },
    { href: "/authority/issues", label: "Issues", icon: "issue" },
    { href: "/authority/sentiment", label: "Team sentiment", icon: "analytics" },
    { href: "/authority/learn", label: "Learning hub", icon: "spark" },
    { href: "/authority/polls", label: "Polls", icon: "flag" },
    { href: "/authority/chat", label: "Chats", icon: "chat" },
    { href: "/public", label: "Public board", icon: "board" },
    { href: "/profile", label: "Profile", icon: "user" },
  ],
  mentor: [
    { href: "/mentor", label: "Dashboard", icon: "dashboard" },
    { href: "/mentor/requests", label: "Requests", icon: "heart" },
    { href: "/mentor/learn", label: "Learning hub", icon: "spark" },
    { href: "/mentor/polls", label: "Polls", icon: "flag" },
    { href: "/mentor/chat", label: "Chats", icon: "chat" },
    { href: "/mentor/schedule", label: "Schedule", icon: "activity" },
    { href: "/public", label: "Public board", icon: "board" },
    { href: "/profile", label: "Profile", icon: "user" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
    { href: "/admin/polls", label: "Polls", icon: "flag" },
    { href: "/admin/resources", label: "Resources", icon: "spark" },
    { href: "/admin/audit-logs", label: "Audit logs", icon: "audit" },
    { href: "/public", label: "Public board", icon: "board" },
    { href: "/profile", label: "Profile", icon: "user" },
  ],
};

const roleCopy: Record<Role, string> = {
  employee: "Private support space",
  authority: "Resolution command center",
  mentor: "Guidance and care hub",
  admin: "Platform operations",
};

function getChatSeenStorageKey(userId: string) {
  return `chat-seen-rooms:${userId}`;
}

function loadSeenRooms(userId: string) {
  try {
    const raw = window.localStorage.getItem(getChatSeenStorageKey(userId));
    if (!raw) return new Set<string>();
    return new Set<string>(JSON.parse(raw));
  } catch {
    return new Set<string>();
  }
}

function initials(name?: string | null) {
  return (name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logoutStore = useAuthStore((s) => s.logout);
  const userId = user?.id;
  const role = (user?.role || "employee") as Role;
  const items = nav[role] || nav.employee;
  const [unreadBadges, setUnreadBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!token || !userId) return;
    const currentUserId = userId;
    let alive = true;
    setAuthToken(token);

    async function loadUnread() {
      try {
        const counts: Record<string, number> = {};
        const seenRooms = loadSeenRooms(currentUserId);

        const countRooms = async (path: string, roomType: string) => {
          const response = await api.get(`/chat/rooms?room_type=${roomType}`);
          const rooms = response.data as Array<{
            last_sender_id?: string | null;
            employee_id?: string | number;
            participant_id?: string | number;
          }>;
          counts[path] = rooms.filter((room) => {
            const otherId = String(role === "employee" ? room.participant_id : room.employee_id);
            const key = `${roomType}:${otherId}`;
            return room.last_sender_id && room.last_sender_id !== userId && !seenRooms.has(key);
          }).length;
        }

        if (role === "employee") {
          await Promise.all([
            countRooms("/employee/chat/authority", "authority"),
            countRooms("/employee/chat/mentor", "mentor"),
          ]);
        } else if (role === "authority") {
          await countRooms("/authority/chat", "authority");
        } else if (role === "mentor") {
          await countRooms("/mentor/chat", "mentor");
        }

        if (alive) setUnreadBadges(counts);
      } catch {
        if (alive) setUnreadBadges({});
      }
    }

    void loadUnread();
    const interval = setInterval(() => void loadUnread(), 15000);
    const handleSeenUpdate = () => void loadUnread();
    window.addEventListener("chat-seen-updated", handleSeenUpdate);

    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("chat-seen-updated", handleSeenUpdate);
    };
  }, [role, token, userId]);

 async function logout() {
    try {
      if (token) {
        await api.delete("/auth/logout");
      }
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    logoutStore();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen soft-grid">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/92 p-4 text-slate-900 shadow-2xl shadow-slate-200/30 backdrop-blur-xl lg:flex">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative mb-6 rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-brand">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-black shadow-brand">
                HE
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Health Equity</p>
                <p className="text-sm font-black">Mentoring</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-100 p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                {initials(user?.full_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user?.full_name || "Signed in"}</p>
                <p className="mt-1 inline-flex rounded-full bg-brand/18 px-2.5 py-0.5 text-[11px] font-bold capitalize text-brand">
                  {user?.role || role}
                </p>
              </div>
            </div>
          </div>

          <nav className="relative flex flex-1 flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition duration-200",
                  pathname === item.href || (item.href === "/employee/ai-chat" && pathname.startsWith("/employee/ai-chat"))
                    ? "bg-brand text-white shadow-brand"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                {item.label}
                {unreadBadges[item.href] > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white">
                    {unreadBadges[item.href]}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" className="relative mt-4 w-full text-slate-900 hover:bg-slate-100" onClick={() => void logout()}>
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </Button>
        </aside>
        <main className="min-w-0 flex-1 space-y-6">
          <header className="overflow-hidden rounded-3xl border border-white/70 bg-white/[0.86] p-5 shadow-xl shadow-slate-200/70 backdrop-blur lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-black uppercase text-brand">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {roleCopy[role]}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {user?.full_name || "Member"} - <span className="font-bold capitalize text-brand">{user?.role || role}</span>
              </p>
            </div>
              <div className="hidden items-center gap-3 rounded-3xl bg-white px-4 py-3 text-slate-900 shadow-2xl shadow-slate-200/20 lg:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand font-black">
                  {initials(user?.full_name)}
                </span>
                <div>
                  <p className="text-xs text-slate-500">Live workspace</p>
                  <p className="text-sm font-bold">All systems ready</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold",
                    pathname === item.href || (item.href === "/employee/ai-chat" && pathname.startsWith("/employee/ai-chat"))
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  )}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
