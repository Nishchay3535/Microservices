"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/common/UI";

interface TrendData {
  department: string;
  average_mood: number;
  average_workload: number;
  average_sleep: number;
  average_safety: number;
  average_support: number;
  total_checkins: number;
  burnout_percentage: number;
}

export default function SentimentTrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkins/department-trends`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTrends(data);
        }
      } catch (error) {
        console.error("Failed to fetch trends", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <AuthGuard roles={["authority", "admin"]}>
        <DashboardShell title="Sentiment Trends">
          <div>Loading...</div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["authority", "admin"]}>
      <DashboardShell title="Sentiment Trends">
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Anonymized department-level trends from employee check-ins.
          </p>
          {trends.length === 0 ? (
            <Card>
              <p>No check-in data available yet.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trends.map((trend) => (
                <Card key={trend.department}>
                  <h3 className="font-semibold mb-4">{trend.department}</h3>
                  <div className="space-y-2 text-sm">
                    <div>Mood: {trend.average_mood.toFixed(1)}/5</div>
                    <div>Workload: {trend.average_workload.toFixed(1)}/5</div>
                    <div>Sleep: {trend.average_sleep.toFixed(1)}/5</div>
                    <div>Safety: {trend.average_safety.toFixed(1)}/5</div>
                    <div>Support: {trend.average_support.toFixed(1)}/5</div>
                    <div>Total Check-ins: {trend.total_checkins}</div>
                    <div>Burnout Risk: {trend.burnout_percentage.toFixed(1)}%</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}