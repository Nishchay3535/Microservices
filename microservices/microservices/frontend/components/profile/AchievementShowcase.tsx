"use client";

import { Icon } from "@/components/common/Icons";
import { Card } from "@/components/common/UI";
import type { AchievementShowcaseProps } from "@/types/profile";

const rarityLabels: Record<string, string> = {
  common: "bg-slate-100 text-slate-700",
  rare: "bg-sky-100 text-sky-700",
  epic: "bg-violet-100 text-violet-700",
  legendary: "bg-amber-100 text-amber-700",
};

export function AchievementShowcase({ achievements, nextAchievement }: AchievementShowcaseProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">Achievements</h2>
            <p className="text-sm text-slate-500">Milestones earned through support, issues, and mentoring.</p>
          </div>
          {nextAchievement ? (
            <div className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              Next badge: {nextAchievement.title}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`group relative overflow-hidden rounded-3xl border p-5 transition ${achievement.isLocked ? "border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-white shadow-sm"} ${achievement.isNew && !achievement.isLocked ? "animate-pulse" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${rarityLabels[achievement.rarity]} shadow-sm`}>
                  <Icon name={achievement.isLocked ? "shield" : "spark"} className="h-5 w-5" />
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${achievement.isLocked ? "bg-slate-200 text-slate-500" : achievement.rarity === "legendary" ? "bg-amber-100 text-amber-700" : achievement.rarity === "epic" ? "bg-violet-100 text-violet-700" : achievement.rarity === "rare" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"}`}>
                  {achievement.rarity}
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950">{achievement.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{achievement.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>{achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : "Locked"}</span>
                  {achievement.isLocked ? <span className="inline-flex items-center gap-1"><Icon name="shield" className="h-3.5 w-3.5" />Locked</span> : null}
              </div>
            </div>
          ))}
        </div>

        {nextAchievement ? (
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Progress to next achievement</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500" style={{ width: `${Math.min(100, (nextAchievement.current / nextAchievement.goal) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{nextAchievement.current}/{nextAchievement.goal} actions</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
