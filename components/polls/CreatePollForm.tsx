"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";

interface PollForm {
  question: string;
  options: string[];
  target_audience: string;
  expires_at?: string;
}

export function CreatePollForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState<PollForm>({
    question: "",
    options: ["", "", "", "", ""],
    target_audience: "role:employee",
    expires_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const options = form.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      setError("Add at least two answer options.");
      setLoading(false);
      return;
    }
    try {
      await api.post("/polls/", {
        question: form.question.trim(),
        options,
        target_audience: form.target_audience,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      setSuccess("Poll created. Eligible users will see it on their Polls page.");
      setForm({
        question: "",
        options: ["", "", "", "", ""],
        target_audience: "role:employee",
        expires_at: "",
      });
      onCreated?.();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create poll."));
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold">Create pulse poll</h2>
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
          {success}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Question</label>
          <input
            type="text"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full rounded-md border p-2"
            maxLength={512}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Options (2–5)</label>
          {form.options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="mb-2 w-full rounded-md border p-2"
              placeholder={`Option ${index + 1}`}
              maxLength={100}
            />
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Target audience</label>
          <select
            value={form.target_audience}
            onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
            className="w-full rounded-md border p-2"
          >
            <option value="all">All users</option>
            <option value="role:employee">Employees</option>
            <option value="role:mentor">Mentors</option>
            <option value="role:authority">Authority</option>
            <option value="department:IT">IT department</option>
            <option value="department:HR">HR department</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Expires at (optional)</label>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className="w-full rounded-md border p-2"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create poll"}
        </Button>
      </form>
    </Card>
  );
}
