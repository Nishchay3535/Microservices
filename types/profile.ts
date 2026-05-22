import type { IconName } from "@/components/common/Icons";

export type ProfileRole = "employee" | "mentor" | "authority" | "admin";

export interface ProfileUser {
  id: string;
  email: string;
  full_name: string;
  role: ProfileRole;
  department?: string | null;
  position?: string | null;
  impact_score: number;
  avatar_url?: string | null;
  last_login_at?: string | null;
  last_active_at?: string | null;
  online?: boolean;
  ip_country?: string | null;
  device?: string | null;
}

export interface ActivitySquare {
  date: string;
  count: number;
}

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned_at?: string | null;
  rarity: AchievementRarity;
  isLocked?: boolean;
  isNew?: boolean;
}

export interface StatTrendPoint {
  date: string;
  value: number;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string | number;
  icon: IconName;
  tone: "pink" | "blue" | "green" | "amber";
  sparkline: StatTrendPoint[];
  subtitle?: string;
}

export interface TrustPrivacyData {
  storedItems: string[];
  lastLogin?: string | null;
  ipCountry?: string | null;
  device?: string | null;
}

export interface IssueTimelineItem {
  id: string;
  title: string;
  status: "submitted" | "under_review" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
  snippet: string;
  assigned_authority?: string | null;
}

export interface MentorConnection {
  id: string;
  full_name: string;
  specialization: string;
  availability: "online" | "offline" | "busy";
  avatar_url?: string | null;
}

export interface SupportPerson {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

export interface MenteeCard {
  id: string;
  full_name: string;
  issues_count: number;
  last_session_at?: string | null;
  session_status: string;
}

export interface SessionEvent {
  id: string;
  mentee_name: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

export interface PerformanceMetric {
  id: string;
  label: string;
  description: string;
  percentage: number;
  icon: IconName;
}

export interface IssueSummary {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "escalated";
  assigned_to?: string | null;
  updated_at: string;
}

export interface DepartmentHealthScore {
  score: number;
  resolutionSpeed: number;
  engagement: number;
  responseRate: number;
  trend: "up" | "down" | "steady";
}

export interface AuditEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ip: string;
  type: "review" | "update" | "delete" | "login" | "access";
}

export interface HeroSectionProps {
  user: ProfileUser;
  activityCount: number;
  loading?: boolean;
  onUpdateProfile: (data: {
    full_name: string;
    department?: string | null;
    position?: string | null;
    avatarFile?: File | null;
  }) => Promise<void>;
}

export interface ActivityHeatmapProps {
  activity: ActivitySquare[];
  role: ProfileRole;
}

export interface AchievementShowcaseProps {
  achievements: Achievement[];
  nextAchievement?: {
    title: string;
    current: number;
    goal: number;
  };
}

export interface StatsRowProps {
  stats: StatCardData[];
}

export interface TrustPrivacyPanelProps {
  data: TrustPrivacyData;
  onDownloadData: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export interface IssueJourneyTimelineProps {
  issues: IssueTimelineItem[];
}

export interface MentorConnectionCardProps {
  mentor?: MentorConnection | null;
  sessions: { id: string; date: string; status: string }[];
  onMessageMentor: () => void;
  onRequestSession: () => Promise<void>;
}

export interface SupportNetworkWidgetProps {
  supporters: SupportPerson[];
}

export interface MenteeRosterProps {
  mentees: MenteeCard[];
  helpCount: number;
  resolvedIssues: number;
  onViewIssues: (menteeId: string) => void;
  onOpenChat: (menteeId: string) => void;
  onScheduleSession: (menteeId: string) => void;
}

export interface SessionCalendarWidgetProps {
  sessions: SessionEvent[];
  onMarkComplete: (sessionId: string) => Promise<void>;
}

export interface MentorPerformanceMetricsProps {
  metrics: PerformanceMetric[];
}

export interface IssueManagementSummaryProps {
  issues: IssueSummary[];
  stats: { name: string; value: number }[];
  onUpdateStatus: (issueId: string, status: string) => Promise<void>;
}

export interface DepartmentHealthScoreProps {
  score: DepartmentHealthScore;
}

export interface AuthorityAuditTrailProps {
  entries: AuditEntry[];
}
