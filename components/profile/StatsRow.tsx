"use client";

import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { Card } from "@/components/common/UI";
import { Icon } from "@/components/common/Icons";
import type { StatsRowProps } from "@/types/profile";

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Performance stats</h2>
          <p className="text-sm text-slate-500">Trends from the last seven days.</p>
        </div>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-1">
        {stats.map((item) => (
          <div key={item.id} className="min-w-[220px] rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-950">{item.value}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              </div>
            </div>
            <div className="mt-4 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={item.sparkline}>
                  <Tooltip cursor={false} contentStyle={{ display: "none" }} />
                  <Line type="natural" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {item.subtitle ? <p className="mt-3 text-xs text-slate-500">{item.subtitle}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
