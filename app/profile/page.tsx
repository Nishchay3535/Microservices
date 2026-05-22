"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { AchievementShowcase } from "@/components/profile/AchievementShowcase";
import { HeroSection } from "@/components/profile/HeroSection";
import { IssueJourneyTimeline } from "@/components/profile/employee/IssueJourneyTimeline";
import { MentorConnectionCard } from "@/components/profile/employee/MentorConnectionCard";
import { SupportNetworkWidget } from "@/components/profile/employee/SupportNetworkWidget";
import { MenteeRoster } from "@/components/profile/mentor/MenteeRoster";
import { MentorPerformanceMetrics } from "@/components/profile/mentor/MentorPerformanceMetrics";
import { SessionCalendarWidget } from "@/components/profile/mentor/SessionCalendarWidget";
import { IssueManagementSummary } from "@/components/profile/authority/IssueManagementSummary";
import { DepartmentHealthScore as DepartmentHealthScoreCard } from "@/components/profile/authority/DepartmentHealthScore";
import { AuthorityAuditTrail } from "@/components/profile/authority/AuthorityAuditTrail";
import { StatsRow } from "@/components/profile/StatsRow";
import { TrustPrivacyPanel } from "@/components/profile/TrustPrivacyPanel";
import type {
  Achievement,
  ActivitySquare,
  AuditEntry,
  DepartmentHealthScore as DepartmentHealthScoreType,
  IssueSummary,
  IssueTimelineItem,
  MentorConnection,
  MenteeCard,
  PerformanceMetric,
  ProfileUser,
  SessionEvent,
  StatCardData,
  SupportPerson,
  TrustPrivacyData,
} from "@/types/profile";

const defaultTrustData: TrustPrivacyData = {
  storedItems: ["Email", "Role", "Impact score", "Activity log", "Mentorship sessions"],
  lastLogin: null,
  ipCountry: null,
  device: null,
};

export default function ProfilePage() {
  const storedUser = useAuthStore((state) => state.user);
  const authToken = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [user, setUser] = useState<ProfileUser | null>(storedUser);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivitySquare[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [trustData, setTrustData] = useState<TrustPrivacyData>(defaultTrustData);
  const [issues, setIssues] = useState<IssueTimelineItem[]>([]);
  const [mentorConnection, setMentorConnection] = useState<MentorConnection | null>(null);
  const [supporters, setSupporters] = useState<SupportPerson[]>([]);
  const [mentees] = useState<MenteeCard[]>([]);
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [issueSummary, setIssueSummary] = useState<IssueSummary[]>([]);
  const [healthScore] = useState<DepartmentHealthScoreType>({ score: 78, resolutionSpeed: 82, engagement: 71, responseRate: 79, trend: "up" });
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!storedUser) return;
      setLoading(true);
      try {
        const [achievementsResult, issueResult, sessionResult, mentorResult, publicResult, auditResult, profileResult] = await Promise.allSettled([
          api.get<Achievement[]>("/achievements/"),
          api.get<{ issues: IssueTimelineItem[] }>("/issues?mine=true"),
          api.get<SessionEvent[]>("/mentorship/sessions"),
          api.get<MentorConnection>("/users/mentor"),
          api.get<SupportPerson[]>("/public-posts?mine=true"),
          api.get<AuditEntry[]>("/admin/audit-logs?mine=true"),
          api.get<ProfileUser>("/users/me"),
        ]);

        if (profileResult.status === "fulfilled") {
          setUser((prev) => ({ ...prev, ...profileResult.value.data }));
        }

        if (achievementsResult.status === "fulfilled") {
          setAchievements(achievementsResult.value.data);
        }

        if (issueResult.status === "fulfilled") {
          setIssues(issueResult.value.data.issues ?? []);
        }

        if (sessionResult.status === "fulfilled") {
          setSessions(sessionResult.value.data);
        }

        if (mentorResult.status === "fulfilled") {
          setMentorConnection(mentorResult.value.data);
        }

        if (publicResult.status === "fulfilled") {
          setSupporters(publicResult.value.data.slice(0, 12));
        }

        if (auditResult.status === "fulfilled") {
          setAuditEntries(auditResult.value.data);
        }
      } catch (error) {
        console.error("Profile load error", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [storedUser]);

  useEffect(() => {
    if (!user) return;

    setStats([
      {
        id: "days-active",
        label: "Days active",
        value: Math.max(12, Math.min(365, Math.round(user.impact_score * 3))),
        icon: "activity",
        tone: "pink",
        subtitle: "Weekly trend",
        sparkline: Array.from({ length: 7 }).map((_, index) => ({ date: `day-${index + 1}`, value: Math.round(Math.random() * 10 + 5) })),
      },
      {
        id: "total-actions",
        label: "Total actions",
        value: Math.max(18, Math.round(user.impact_score * 8)),
        icon: "spark",
        tone: "blue",
        subtitle: "This week",
        sparkline: Array.from({ length: 7 }).map((_, index) => ({ date: `day-${index + 1}`, value: Math.round(Math.random() * 25 + 10) })),
      },
      {
        id: "streak",
        label: "Streak",
        value: Math.min(28, Math.max(1, Math.round(user.impact_score / 4))),
        icon: "user",
        tone: "green",
        subtitle: "Consecutive days",
        sparkline: Array.from({ length: 7 }).map((_, index) => ({ date: `day-${index + 1}`, value: Math.round(Math.random() * 6 + 2) })),
      },
      {
        id: "rank",
        label: "Rank among peers",
        value: `#${Math.max(1, 30 - Math.round(user.impact_score))}`,
        icon: "analytics",
        tone: "amber",
        subtitle: "Leaderboard",
        sparkline: Array.from({ length: 7 }).map((_, index) => ({ date: `day-${index + 1}`, value: Math.round(Math.random() * 5 + 3) })),
      },
    ]);

    setActivity(Array.from({ length: 180 }).map((_, index) => ({ date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), count: Math.floor(Math.random() * 3) })));
    setTrustData((prev) => ({ ...prev, lastLogin: user.last_login_at ?? prev.lastLogin, ipCountry: user.ip_country ?? prev.ipCountry, device: user.device ?? prev.device }));
    setPerformanceMetrics([
      { id: "response-rate", label: "Response rate", description: "Messages replied within 24h", percentage: 88, icon: "chat" },
      { id: "resolution-time", label: "Avg resolution time", description: "Days to resolve issues", percentage: 71, icon: "issue" },
      { id: "satisfaction-score", label: "Satisfaction score", description: "Employee feedback rating", percentage: 92, icon: "heart" },
    ]);
    setIssueSummary([
      { id: "1", title: "Workspace harassment concern", status: "in_progress", assigned_to: "Authority Team", updated_at: new Date().toISOString() },
      { id: "2", title: "Mentorship request delay", status: "open", assigned_to: "Mentor Team", updated_at: new Date().toISOString() },
      { id: "3", title: "Policy clarification needed", status: "resolved", assigned_to: "HR", updated_at: new Date().toISOString() },
    ]);
  }, [user]);

  const nextAchievement = useMemo(
    () => ({ current: achievements.length * 2, goal: Math.max(10, achievements.length * 3), title: "Community Builder" }),
    [achievements.length]
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleUpdateProfile = async (payload: { full_name: string; department?: string | null; position?: string | null; avatarFile?: File | null }) => {
    if (!user) return;

    try {
      const updateData: { full_name: string; department?: string | null; position?: string | null; avatar_url?: string | null } = {
        full_name: payload.full_name,
        department: payload.department,
        position: payload.position,
      };

      if (payload.avatarFile) {
        const formData = new FormData();
        formData.append("file", payload.avatarFile);
        const avatarResult = await api.post<{ url: string }>("/users/me/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updateData.avatar_url = avatarResult.data.url;
      }

      await api.put("/users/me", updateData);

      const nextUser = { ...user, ...updateData };
      setUser(nextUser);
      if (authToken) {
        setAuth(authToken, nextUser);
      }
      showToast("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed", error);
      showToast("Failed to update profile. Please try again.");
    }
  };

  const escapePdfText = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r/g, "").replace(/\n/g, " ");

  const createPdfBlob = (lines: string[]) => {
    const safeLines = lines.slice(0, 38).map((line) => escapePdfText(line));
    const content = safeLines
      .map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 18} Td (${line}) Tj ET`)
      .join("\n");

    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
      `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    ];

    let offset = 0;
    const xrefEntries = ["0000000000 65535 f "];
    const body = objects
      .map((obj) => {
        const line = `${obj}\n`;
        const current = offset;
        xrefEntries.push(current.toString().padStart(10, "0") + " 00000 n ");
        offset += line.length;
        return line;
      })
      .join("");

    const xrefStart = offset;
    const xref = [
      "xref",
      `0 ${objects.length + 1}`,
      ...xrefEntries,
    ].join("\n") + "\n";

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    const pdfData = `%PDF-1.3\n${body}${xref}${trailer}`;
    return new Blob([pdfData], { type: "application/pdf" });
  };

  const buildDownloadLines = (profile: ProfileUser) => {
    const lines = [
      "Health Equity - Profile Export",
      "--------------------------------------",
      `Name: ${profile.full_name}`,
      `Email: ${profile.email}`,
      `Role: ${profile.role}`,
      `Department: ${profile.department || "Not provided"}`,
      `Position: ${profile.position || "Not provided"}`,
      `Impact score: ${profile.impact_score}`,
      "",
      "Trust & Privacy Summary",
      `Last login: ${trustData.lastLogin || "Unknown"}`,
      `Country/IP: ${trustData.ipCountry || "Not available"}`,
      `Device: ${trustData.device || "Unknown"}`,
      `Stored items: ${trustData.storedItems.join(", ")}`,
      "",
      "Achievements",
      `Total achievements: ${achievements.length}`,
      ...achievements.slice(0, 6).map((achievement) => `- ${achievement.title} (${achievement.rarity})`),
      achievements.length > 6 ? `- +${achievements.length - 6} more achievements` : "",
      "",
      "Issues",
      `Total issues: ${issues.length}`,
      ...issues.slice(0, 6).map((issue) => `- ${issue.title} [${issue.status}]`),
      issues.length > 6 ? `- +${issues.length - 6} more issues` : "",
      "",
      "Mentorship & Support",
      `Mentor assigned: ${mentorConnection?.full_name || "None"}`,
      `Supporters: ${supporters.length}`,
      `Upcoming sessions: ${sessions.length}`,
    ];
    return lines.filter(Boolean);
  };

  const handleDownloadData = async () => {
    if (!user) {
      showToast("Unable to download profile data. No profile loaded.");
      return;
    }

    try {
      const lines = buildDownloadLines(user);
      const blob = createPdfBlob(lines);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "health-equity-profile.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Profile export download started.");
    } catch (error) {
      console.error("Download failed", error);
      showToast("Unable to download profile data. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    await api.delete("/gdpr/me");
    showToast("Your account deletion request is submitted.");
  };

  const handleRequestSession = async () => {
    try {
      await api.post("/mentorship/request", { topic: "Request new mentoring support" });
      await refreshSessions();
      showToast("Mentorship request created.");
    } catch (error) {
      console.error("Mentorship request failed", error);
      showToast("Unable to create mentorship request. Please try again.");
    }
  };

  const router = useRouter();

  const handleMessageMentor = () => {
    router.push("/employee/chat/mentor");
  };

  const handleViewIssues = (menteeId: string) => {
    router.push(`/mentor/issues?mentee=${encodeURIComponent(menteeId)}`);
  };

  const handleOpenChat = (menteeId: string) => {
    router.push(`/mentor/chat?menteeId=${encodeURIComponent(menteeId)}`);
  };

  const handleScheduleSession = (menteeId: string) => {
    router.push(`/mentor/schedule?mentee=${encodeURIComponent(menteeId)}`);
  };

  const refreshSessions = async () => {
    try {
      const response = await api.get<SessionEvent[]>("/mentorship/sessions");
      setSessions(response.data);
    } catch (error) {
      console.error("Session refresh failed", error);
    }
  };

  const handleMarkComplete = async (sessionId: string) => {
    try {
      await api.put(`/mentorship/sessions/${sessionId}`, { status: "completed" });
      await refreshSessions();
      showToast("Session marked complete.");
    } catch (error) {
      console.error("Mark complete failed", error);
      showToast("Unable to mark session complete. Please try again.");
    }
  };

  const handleIssueStatusUpdate = async (issueId: string, status: string) => {
    try {
      await api.put(`/issues/${issueId}/status`, { status });
      showToast("Issue status updated.");
    } catch (error) {
      console.error("Issue status update failed", error);
      showToast("Unable to update issue status. Please try again.");
    }
  };

  if (!user) {
    return (
      <AuthGuard>
        <DashboardShell title="Personal profile">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-base font-bold text-slate-700">Loading profile information…</div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardShell title="Personal profile">
        <div className="space-y-6">
          <HeroSection user={user} activityCount={activity.filter((item) => item.count > 0).length} loading={loading} onUpdateProfile={handleUpdateProfile} />

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <ActivityHeatmap activity={activity} role={user.role} />
            <AchievementShowcase achievements={achievements} nextAchievement={nextAchievement} />
          </div>

          <StatsRow stats={stats} />
          <TrustPrivacyPanel data={trustData} onDownloadData={handleDownloadData} onDeleteAccount={handleDeleteAccount} />

          {user.role === "employee" ? (
            <div className="space-y-6">
              <IssueJourneyTimeline issues={issues.length ? issues : [{ id: "empty", title: "No issues submitted yet", status: "submitted", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), snippet: "Start tracking your issue journey here.", assigned_authority: null }]} />
              <div className="grid gap-6 lg:grid-cols-2">
                <MentorConnectionCard mentor={mentorConnection} sessions={sessions.slice(0, 3).map((session) => ({ id: session.id, date: session.date, status: session.status }))} onMessageMentor={handleMessageMentor} onRequestSession={handleRequestSession} />
                <SupportNetworkWidget supporters={supporters.length ? supporters : [{ id: "demo-1", full_name: "Ayesha Khan" }, { id: "demo-2", full_name: "Mira Patel" }, { id: "demo-3", full_name: "Sana Ahmed" }]} />
              </div>
            </div>
          ) : null}

          {user.role === "mentor" ? (
            <div className="space-y-6">
              <MenteeRoster mentees={mentees.length ? mentees : [{ id: "mentee-1", full_name: "Tara Singh", issues_count: 3, last_session_at: new Date().toISOString(), session_status: "active" }]} helpCount={mentees.length || 1} resolvedIssues={issues.length || 5} onViewIssues={handleViewIssues} onOpenChat={handleOpenChat} onScheduleSession={handleScheduleSession} />
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <SessionCalendarWidget sessions={sessions.length ? sessions : [{ id: "session-1", mentee_name: "Tara Singh", date: new Date().toISOString(), time: "2:00 PM", type: "Check-in", status: "scheduled" }]} onMarkComplete={handleMarkComplete} />
                <MentorPerformanceMetrics metrics={performanceMetrics} />
              </div>
            </div>
          ) : null}

          {user.role === "authority" ? (
            <div className="space-y-6">
              <IssueManagementSummary issues={issueSummary} stats={[{ name: "Open", value: 18 }, { name: "In Progress", value: 10 }, { name: "Resolved", value: 23 }, { name: "Escalated", value: 4 }]} onUpdateStatus={handleIssueStatusUpdate} />
              <DepartmentHealthScoreCard score={healthScore} />
              <AuthorityAuditTrail entries={auditEntries.length ? auditEntries : [{ id: "1", action: "review", description: "Approved new issue escalation", timestamp: new Date().toISOString(), ip: "203.0.113.12", type: "review" }]} />
            </div>
          ) : null}
        </div>

        {toast ? <div className="fixed bottom-6 right-6 z-50 rounded-3xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-950/40">{toast}</div> : null}
      </DashboardShell>
    </AuthGuard>
  );
}
