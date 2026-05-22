"use client";

import { useState } from "react";
import { Card } from "@/components/common/UI";
import type { TrustPrivacyPanelProps } from "@/types/profile";

export function TrustPrivacyPanel({ data, onDownloadData, onDeleteAccount }: TrustPrivacyPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await onDeleteAccount();
      setConfirmOpen(false);
    } catch {
      setError("Could not delete account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Trust & privacy</h2>
            <p className="text-sm text-slate-500">See what personal data is stored and manage your account privacy.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onDownloadData} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800">
              Download my data
            </button>
            <button type="button" onClick={() => setConfirmOpen(true)} className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
              Delete my account
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Last login</p>
            <p className="mt-2 text-base font-black text-slate-950">{data.lastLogin ? new Date(data.lastLogin).toLocaleString() : "Unknown"}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Country / IP</p>
            <p className="mt-2 text-base font-black text-slate-950">{data.ipCountry || "Not available"}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Device</p>
            <p className="mt-2 text-base font-black text-slate-950">{data.device || "Unknown"}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Data stored about you</p>
          <ul className="mt-3 space-y-2 list-disc pl-5 text-slate-600">
            {data.storedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {error ? <div className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-950">Confirm account deletion</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">This action is permanent and will remove your profile data from the platform.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={handleDelete} className="rounded-3xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-60">
                {busy ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
