"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";

interface CheckInForm {
  mood_score: number;
  workload_score: number;
  sleep_score: number;
  safety_score: number;
  support_score: number;
}

const questions = [
  { key: "mood_score", label: "How is your overall mood this week? (1-5)" },
  { key: "workload_score", label: "How manageable is your workload? (1-5)" },
  { key: "sleep_score", label: "How well are you sleeping? (1-5)" },
  { key: "safety_score", label: "Do you feel safe at work? (1-5)" },
  { key: "support_score", label: "Do you feel supported by your team? (1-5)" },
];

export default function CheckInPage() {
  const [form, setForm] = useState<CheckInForm>({
    mood_score: 3,
    workload_score: 3,
    sleep_score: 3,
    safety_score: 3,
    support_score: 3,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/checkins/", form);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to submit check-in."));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthGuard roles={["employee"]}>
        <DashboardShell title="Weekly Check-In">
          <Card className="mx-auto max-w-md text-center">
            <h2 className="mb-4 text-xl font-semibold">Thank you!</h2>
            <p>Your check-in has been submitted. We&apos;ll use this to provide better support.</p>
          </Card>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Weekly Check-In">
        <Card className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-xl font-semibold">How are you feeling this week?</h2>
          <p className="mb-6 text-sm text-gray-600">
            Your responses help us identify trends to improve workplace health.
          </p>
          {error && (
            <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q) => (
              <div key={q.key}>
                <label className="mb-2 block text-sm font-medium">{q.label}</label>
                <select
                  value={form[q.key as keyof CheckInForm]}
                  onChange={(e) =>
                    setForm({ ...form, [q.key]: parseInt(e.target.value, 10) })
                  }
                  className="w-full rounded-md border p-2"
                  required
                >
                  <option value={1}>1 - Very Poor</option>
                  <option value={2}>2 - Poor</option>
                  <option value={3}>3 - Neutral</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>
            ))}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Check-In"}
            </Button>
          </form>
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}
