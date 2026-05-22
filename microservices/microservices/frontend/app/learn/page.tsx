"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, Icon, LoadingSkeleton } from "@/components/common/UI";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { RESOURCE_CATEGORIES } from "@/components/resources/CreateResourceForm";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  estimated_minutes: number;
  is_completed: boolean;
};

type Progress = {
  completed_count: number;
  total_count: number;
  learning_streak_weeks: number;
};

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  ...RESOURCE_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
] as const;

export default function LearnPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [listRes, progRes] = await Promise.all([
        api.get<Resource[]>("/resources/"),
        api.get<Progress>("/resources/my-progress"),
      ]);
      setResources(listRes.data);
      setProgress(progRes.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load learning resources."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (category === "all") return resources;
    return resources.filter((r) => r.category === category);
  }, [resources, category]);

  async function markComplete(resourceId: string) {
    setCompletingId(resourceId);
    setError(null);
    try {
      await api.post(`/resources/${resourceId}/complete`);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not mark resource complete."));
    } finally {
      setCompletingId(null);
    }
  }

  const completedCount = progress?.completed_count ?? resources.filter((r) => r.is_completed).length;
  const totalCount = progress?.total_count ?? resources.length;
  const streak = progress?.learning_streak_weeks ?? 0;

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Learning hub">
        {loading ? (
          <Card>
            <LoadingSkeleton rows={5} />
          </Card>
        ) : (
          <div className="space-y-6">
            {error && (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600" role="alert">
                {error}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-sky-200/80 bg-gradient-to-br from-sky-50 to-white">
                <p className="text-xs font-black uppercase text-sky-700">Catalog</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{totalCount}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Active resources</p>
              </Card>
              <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white">
                <p className="text-xs font-black uppercase text-emerald-700">Completed</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{completedCount}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Marked in your profile</p>
              </Card>
              <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50 to-white">
                <p className="text-xs font-black uppercase text-amber-800">Streak</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{streak}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Consecutive weeks with a completion</p>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    category === c.id ? "bg-brand text-white shadow-brand" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand/40"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon="spark"
                title="No resources here"
                text={
                  category === "all"
                    ? "Your mentors and authority team will publish modules here."
                    : "Try another category or view all resources."
                }
              />
            ) : (
              <div className="space-y-4">
                {filtered.map((resource) => (
                  <Card key={resource.id} className="border-slate-100">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">{resource.title}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-600">
                            {resource.category.replace(/_/g, " ")}
                          </span>
                          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                            ~{resource.estimated_minutes} min
                          </span>
                        </div>
                        {resource.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                        ) : null}
                        {resource.is_completed ? (
                          <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                            <Icon name="check" className="h-4 w-4" />
                            Completed
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="outline" className="px-3 py-2 text-xs" type="button" onClick={() => window.open(resource.url, "_blank", "noopener,noreferrer")}>
                          Open link
                        </Button>
                        {!resource.is_completed ? (
                          <Button
                            className="px-3 py-2 text-xs"
                            type="button"
                            disabled={completingId === resource.id}
                            onClick={() => void markComplete(resource.id)}
                          >
                            {completingId === resource.id ? "Saving…" : "Mark complete"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}
