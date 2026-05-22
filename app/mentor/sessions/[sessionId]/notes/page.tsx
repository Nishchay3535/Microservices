"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";

interface SessionNotes {
  id: string;
  summary: string;
  key_takeaways: string[];
  follow_up_actions: any[];
  created_at: string;
  updated_at: string;
}

interface NotesForm {
  summary: string;
  key_takeaways: string[];
  follow_up_actions: { action: string; due_date?: string }[];
}

export default function MentorSessionNotesPage() {
  const { sessionId } = useParams();
  const [notes, setNotes] = useState<SessionNotes | null>(null);
  const [form, setForm] = useState<NotesForm>({
    summary: "",
    key_takeaways: [""],
    follow_up_actions: [{ action: "" }],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        // Notes not created yet
        setNotes(null);
      }
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mentorship/sessions/${sessionId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          key_takeaways: form.key_takeaways.filter(k => k.trim()),
          follow_up_actions: form.follow_up_actions.filter(a => a.action.trim()),
        }),
      });
      if (response.ok) {
        fetchNotes();
      } else {
        alert("Failed to save notes");
      }
    } catch (error) {
      alert("Error saving notes");
    } finally {
      setSubmitting(false);
    }
  };

  const updateKeyTakeaway = (index: number, value: string) => {
    const newTakeaways = [...form.key_takeaways];
    newTakeaways[index] = value;
    setForm({ ...form, key_takeaways: newTakeaways });
  };

  const addKeyTakeaway = () => {
    setForm({ ...form, key_takeaways: [...form.key_takeaways, ""] });
  };

  const updateAction = (index: number, field: string, value: string) => {
    const newActions = [...form.follow_up_actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setForm({ ...form, follow_up_actions: newActions });
  };

  const addAction = () => {
    setForm({ ...form, follow_up_actions: [...form.follow_up_actions, { action: "" }] });
  };

  if (loading) {
    return (
      <AuthGuard roles={["mentor"]}>
        <DashboardShell title="Session Notes">
          <div>Loading...</div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["mentor"]}>
      <DashboardShell title="Session Notes">
        {notes ? (
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
                <ul className="list-disc list-inside text-sm mt-1">
                  {notes.follow_up_actions.map((action: any, index: number) => (
                    <li key={index}>
                      {action.action}
                      {action.due_date && (
                        <span className="text-gray-500 ml-2">
                          (Due: {new Date(action.due_date).toLocaleDateString()})
                        </span>
                      )}
                      {action.completed ? (
                        <span className="text-green-600 ml-2">✓ Completed</span>
                      ) : (
                        <span className="text-orange-600 ml-2">Pending</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-semibold mb-6">Add Session Notes</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Summary</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  maxLength={2000}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Takeaways</label>
                {form.key_takeaways.map((takeaway, index) => (
                  <input
                    key={index}
                    type="text"
                    value={takeaway}
                    onChange={(e) => updateKeyTakeaway(index, e.target.value)}
                    className="w-full p-2 border rounded-md mb-2"
                    placeholder="Key takeaway"
                    maxLength={200}
                  />
                ))}
                <Button type="button" variant="outline" onClick={addKeyTakeaway}>
                  Add Takeaway
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Follow-up Actions</label>
                {form.follow_up_actions.map((action, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={action.action}
                      onChange={(e) => updateAction(index, "action", e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                      placeholder="Action"
                      maxLength={500}
                    />
                    <input
                      type="date"
                      value={action.due_date || ""}
                      onChange={(e) => updateAction(index, "due_date", e.target.value)}
                      className="p-2 border rounded-md"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addAction}>
                  Add Action
                </Button>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving..." : "Save Notes"}
              </Button>
            </form>
          </Card>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}