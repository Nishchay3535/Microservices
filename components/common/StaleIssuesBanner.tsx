"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/common/UI";

interface Escalation {
  id: string;
  issue_id: string;
  days_stale: number;
  created_at: string;
}

export function StaleIssuesBanner() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/escalations/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setEscalations(data);
        }
      } catch (error) {
        console.error("Failed to fetch escalations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEscalations();
  }, []);

  if (loading || escalations.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-300 bg-red-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-red-800">Stale Issues Alert</h3>
          <p className="text-sm text-red-700 mt-1">
            {escalations.length} issue{escalations.length > 1 ? "s" : ""} ha{escalations.length > 1 ? "ve" : "s"} been stale for over 7 days and require attention.
          </p>
        </div>
        <span className="text-red-600 font-bold">⚠️</span>
      </div>
    </Card>
  );
}
