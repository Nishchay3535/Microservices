"use client";

import { Icon } from "@/components/common/Icons";
import { Card } from "@/components/common/UI";
import type { MentorPerformanceMetricsProps } from "@/types/profile";

export function MentorPerformanceMetrics({ metrics }: MentorPerformanceMetricsProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Performance metrics</h2>
          <p className="text-sm text-slate-500">A quick view of your mentoring effectiveness.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.id} className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="relative mx-auto mb-4 h-28 w-28">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <circle cx="60" cy="60" r="52" className="fill-none stroke-slate-100 stroke-[14]" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="fill-none stroke-[14]"
                    stroke={metric.percentage >= 80 ? "#22c55e" : metric.percentage >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeDasharray={`${Math.round((metric.percentage / 100) * 327)} 327`}
                    strokeDashoffset="82"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">{metric.percentage}%</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-700">
                <Icon name={metric.icon} className="h-4 w-4" />
                <span className="font-semibold">{metric.label}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
