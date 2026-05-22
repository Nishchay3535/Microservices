"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/common/UI";

interface LeaderboardEntry {
  user_name: string;
  kudos_count: number;
}

export function KudosLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kudos/leaderboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card>
        <h3 className="font-semibold mb-4">Kudos Leaderboard</h3>
        <div>Loading...</div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-semibold mb-4">Kudos Leaderboard</h3>
      {leaderboard.length === 0 ? (
        <p className="text-sm text-gray-600">No kudos data yet.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry, index) => (
            <div key={entry.user_name} className="flex justify-between items-center">
              <span className="text-sm">
                {index + 1}. {entry.user_name}
              </span>
              <span className="text-sm font-semibold">{entry.kudos_count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}