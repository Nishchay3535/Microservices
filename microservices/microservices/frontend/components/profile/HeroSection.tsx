"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/common/Icons";
import { Card } from "@/components/common/UI";
import type { HeroSectionProps, ProfileRole } from "@/types/profile";

const roleStyles: Record<ProfileRole, { banner: string; accent: string }> = {
  employee: { banner: "from-pink-500 via-rose-500 to-fuchsia-500", accent: "text-rose-600" },
  mentor: { banner: "from-violet-500 via-fuchsia-500 to-indigo-500", accent: "text-violet-600" },
  authority: { banner: "from-sky-600 via-indigo-600 to-cyan-500", accent: "text-sky-700" },
  admin: { banner: "from-slate-700 via-slate-900 to-black", accent: "text-slate-200" },
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatRelative = (value?: string | null) => {
  if (!value) return "No recent activity";
  const diff = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return diff === 0 ? "Active just now" : `Last active ${diff} min${diff === 1 ? "" : "s"} ago`;
};

export function HeroSection({ user, activityCount, onUpdateProfile }: HeroSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [department, setDepartment] = useState(user.department ?? "");
  const [position, setPosition] = useState(user.position ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user.avatar_url ?? null);
  const [error, setError] = useState<string | null>(null);

  const theme = roleStyles[user.role] ?? roleStyles.employee;
  const status = useMemo(() => (user.online ? "Online now" : formatRelative(user.last_active_at)), [user.online, user.last_active_at]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onUpdateProfile({ full_name: fullName.trim(), department: department.trim() || null, position: position.trim() || null, avatarFile });
      setOpen(false);
    } catch {
      setError("Unable to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.banner} p-6 text-white shadow-xl`}>
        <div className="absolute inset-x-0 top-0 h-24 bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white/30 bg-white/10 shadow-lg shadow-black/10">
              {preview ? (
                <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-white/15 text-4xl font-black text-white">
                  {getInitials(user.full_name)}
                </div>
              )}
              <span className={`absolute bottom-2 right-2 inline-flex h-4 w-4 rounded-full border border-white ${user.online ? "bg-emerald-400" : "bg-slate-300"}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">{user.role}</p>
              <h1 className="truncate text-4xl font-black text-white">{user.full_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90">
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 font-semibold text-white shadow-sm">
                  {user.department || "No department"}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 font-semibold text-white shadow-sm">
                  {user.position || "No position"}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/80">{status}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] bg-white/10 p-5 shadow-inner shadow-black/10 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">Impact score</p>
                <p className="mt-2 text-5xl font-black text-white">{user.impact_score.toFixed(1)}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 ring-1 ring-white/20">
                <Icon name="spark" className="h-4 w-4" />
                Score shows your community strength
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100">
                <Icon name="user" className="h-4 w-4" />
                Edit profile
              </button>
              <div className="rounded-full bg-white/15 px-4 py-2 text-sm text-white/90">
                {activityCount} actions in the last year
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto mt-6 mb-6 w-full max-w-[min(1600px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30 ring-1 ring-slate-200 max-h-[calc(100vh-4rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-sky-600 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">Edit your Profile</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Personal settings dashboard</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white/15 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                >
                  ✕
                </button>
              </div>
              <div className="mt-5 flex gap-3 text-sm font-semibold text-white">
                <button className="rounded-full bg-white/15 px-4 py-2 transition hover:bg-white/25">Personal</button>
                <button className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20">Dashboard</button>
                <button className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20">Advanced</button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-3xl font-black text-white">
                    {preview ? <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" /> : getInitials(user.full_name)}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Profile photo</p>
                  <p className="mt-2 text-sm text-slate-500">Use a clear headshot for your authority profile.</p>
                  <button
                    type="button"
                    onClick={() => document.getElementById("profile-avatar-input")?.click()}
                    className="mt-5 w-full rounded-3xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
                  >
                    Change photo
                  </button>
                  <input id="profile-avatar-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span className="font-semibold">Full name</span>
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span className="font-semibold">Department</span>
                      <input
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                  </div>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span className="font-semibold">Position</span>
                    <input
                      value={position}
                      onChange={(event) => setPosition(event.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Preview</p>
                    <div className="mt-3 flex h-32 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                      {preview ? (
                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm text-slate-500">No photo selected</span>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-3xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
