"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";

interface FollowUpAction {
  action: string;
  due_date?: string;
  completed?: boolean;
}

interface SessionNotes {
  id: string;
  summary: string;
  key_takeaways: string[];
  follow_up_actions: FollowUpAction[];
  created_at: string;
  updated_at: string;
}

export default function EmployeeSessionNotesPage() {
  const { sessionId } = useParams();
  const [notes, setNotes] = useState<SessionNotes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [sessionId]);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mentorship/sessions/${sessionId}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else if (response.status === 404) {
        setNotes(null);
      }
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = async (actionIndex: number, completed: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mentorship/sessions/${sessionId}/notes/actions/${actionIndex}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });
      if (response.ok) {
        fetchNotes();
      } else {
        alert("Failed to update action");
      }
    } catch {
      alert("Error updating action");
    }
  };

  if (loading) {
    return (
      <AuthGuard roles={["employee"]}>
        <DashboardShell title="Session Notes">
          <div>Loading...</div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  if (!notes) {
    return (
      <AuthGuard roles={["employee"]}>
        <DashboardShell title="Session Notes">
          <Card>
            <p>Notes are not available yet. The mentor will add them after the session.</p>
          </Card>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Session Notes">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Summary</h3>
              <p className="text-sm mt-1">{notes.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold">Key Takeaways</h3>
              <ul className="list-disc list-inside text-sm mt-1">
                {notes.key_takeaways.map((takeaway, index) => (
                  <li key={index}>{takeaway}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Follow-up Actions</h3>
              <div className="space-y-2 mt-1">
                {notes.follow_up_actions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="text-sm">{action.action}</p>
                      {action.due_date && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(action.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={action.completed ? "primary" : "outline"}
                      className="px-3 py-1.5 text-xs"
                      onClick={() => handleToggleAction(index, !action.completed)}
                    >
                      {action.completed ? "✓ Completed" : "Mark Complete"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}