"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/UI";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";

export const RESOURCE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "leadership", label: "Leadership" },
  { value: "technical", label: "Technical" },
  { value: "wellness", label: "Wellness" },
  { value: "communication", label: "Communication" },
] as const;

interface ResourceForm {
  title: string;
  description: string;
  url: string;
  category: string;
  estimated_minutes: number;
}

export function CreateResourceForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState<ResourceForm>({
    title: "",
    description: "",
    url: "",
    category: "general",
    estimated_minutes: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/resources/", form);
      setSuccess("Resource published. Employees will see it in the Learning hub.");
      setForm({
        title: "",
        description: "",
        url: "",
        category: "general",
        estimated_minutes: 10,
      });
      onCreated?.();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create resource."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold">Add learning resource</h2>
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
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border p-2"
            maxLength={256}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border p-2"
            rows={3}
            maxLength={1000}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full rounded-md border p-2"
            maxLength={1024}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-md border p-2"
          >
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Estimated minutes</label>
          <input
            type="number"
            value={form.estimated_minutes}
            onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value, 10) })}
            className="w-full rounded-md border p-2"
            min={1}
            max={300}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Publishing…" : "Publish resource"}
        </Button>
      </form>
    </Card>
  );
}
