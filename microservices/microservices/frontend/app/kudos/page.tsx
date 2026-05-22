"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";

interface Kudos {
  id: string;
  sender_name: string;
  recipient_name: string;
  category: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

interface KudosForm {
  recipient_id: string;
  category: string;
  message: string;
}

export default function KudosPage() {
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<KudosForm>({
    recipient_id: "",
    category: "teamwork",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKudos();
  }, []);

  const fetchKudos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kudos/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setKudos(data);
      }
    } catch (error) {
      console.error("Failed to fetch kudos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kudos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setShowForm(false);
        setForm({ recipient_id: "", category: "teamwork", message: "" });
        fetchKudos();
      } else {
        alert("Failed to send kudos");
      }
    } catch (error) {
      alert("Error sending kudos");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardShell title="Kudos Feed">
          <div>Loading...</div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardShell title="Kudos Feed">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Recognize colleagues for their contributions.</p>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Send Kudos"}
            </Button>
          </div>

          {showForm && (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient</label>
                  <input
                    type="text"
                    placeholder="Enter user ID or name"
                    value={form.recipient_id}
                    onChange={(e) => setForm({ ...form, recipient_id: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="teamwork">Teamwork</option>
                    <option value="innovation">Innovation</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="problem_solving">Problem Solving</option>
                    <option value="inclusivity">Inclusivity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    maxLength={500}
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Kudos"}
                </Button>
              </form>
            </Card>
          )}

          <div className="space-y-4">
            {kudos.length === 0 ? (
              <Card>
                <p>No kudos yet. Be the first to recognize someone!</p>
              </Card>
            ) : (
              kudos.map((item) => (
                <Card key={item.id} className={item.is_pinned ? "border-yellow-300" : ""}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {item.sender_name} → {item.recipient_name}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                      <p className="mt-2">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {item.is_pinned && (
                      <span className="text-yellow-500 font-semibold">📌 Pinned</span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}