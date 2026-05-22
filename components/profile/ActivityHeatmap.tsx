"use client";

import { useMemo } from "react";
import { Card } from "@/components/common/UI";
import type { ActivityHeatmapProps } from "@/types/profile";

const colorStops = ["#EFF6FF", "#C7D2FE", "#A5B4FC", "#818CF8", "#6366F1"];

function getColor(count: number) {
  if (count >= 5) return colorStops[4];
  if (count >= 3) return colorStops[3];
  if (count >= 2) return colorStops[2];
  if (count >= 1) return colorStops[1];
  return colorStops[0];
}

function isoWeekStart(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function ActivityHeatmap({ activity, role }: ActivityHeatmapProps) {
  const squares = useMemo(() => {
    const map = new Map(activity.map((item) => [item.date, item.count]));
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = isoWeekStart(new Date(end.getTime() - 52 * 7 * 24 * 60 * 60 * 1000));
    const cells: Array<{ date: string; count: number; x: number; y: number }> = [];
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    for (let i = 0; i < dayCount; i += 1) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const week = Math.floor(i / 7);
      const day = date.getDay();
      const key = date.toISOString().slice(0, 10);
      cells.push({ date: key, count: map.get(key) ?? 0, x: week, y: day });
    }

    return cells;
  }, [activity]);

  const themeColor = role === "mentor" ? "stroke-violet-300" : role === "authority" ? "stroke-sky-300" : "stroke-rose-300";

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Activity heatmap</h2>
            <p className="text-sm text-slate-500">Your actions over the last 52 weeks.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {activity.length} active days
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <svg width={764} height={120} viewBox="0 0 764 120" className="overflow-visible">
            {squares.map((square) => (
              <rect
                key={`${square.date}-${square.x}`}
                x={square.x * 14}
                y={square.y * 14}
                width={12}
                height={12}
                rx={3}
                fill={getColor(square.count)}
                stroke="#fff"
                strokeWidth={1}
              >
                <title>{`${square.count} action${square.count === 1 ? "" : "s"} on ${square.date}`}</title>
              </rect>
            ))}
          </svg>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`h-2 w-2 rounded-full bg-rose-400 ${themeColor}`} />
          Low intensity
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          High intensity
        </div>
      </div>
    </Card>
  );
}
