"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { api } from "@/lib/api/client";
import { Card, IconBubble, Toast } from "@/components/common/UI";

export default function SubmitIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [category, setCategory] = useState("other");
  const [severity, setSeverity] = useState(3);
  const [urls, setUrls] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/issues/upload-attachment", form);
    setUrls((u) => [...u, res.data.url as string]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await api.post<{ id: string }>("/issues/", {
        title,
        description,
        category,
        severity,
        is_anonymous: anonymous,
        attachment_urls: urls.length ? urls : undefined,
      });
      setSubmittedIssueId(res.data.id);
      setMsgType("success");
      setMsg("Issue submitted");
      setTitle("");
      setDescription("");
      setUrls([]);
      setTimeout(() => setMsg(null), 2400);
    } catch {
      setSubmittedIssueId(null);
      setMsgType("error");
      setMsg("Could not submit. Try again.");
    }
  }

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Submit an issue">
        {msg && <Toast message={msg} type={msgType} />}
        {submittedIssueId && (
          <div className="mb-4 rounded-2xl border border-brand/20 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-700">Need support while this is being reviewed?</p>
              <button
                type="button"
                onClick={() => router.push(`/employee/ai-chat/${submittedIssueId}`)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #FF55B8, #a855f7)" }}
              >
                Talk to AI Support
              </button>
            </div>
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <Card className="bg-slate-950 text-white">
            <IconBubble icon="shield" className="bg-white/10 text-brand" />
            <h2 className="mt-5 text-3xl font-black tracking-tight">Your privacy stays in the design.</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Choose anonymous mode when you want identity hidden from peers. Attach evidence only when it helps resolution.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-bold">
              <div className="rounded-2xl bg-white/[0.08] p-3">Anonymous submission available</div>
              <div className="rounded-2xl bg-white/[0.08] p-3">Severity helps triage priority</div>
              <div className="rounded-2xl bg-white/[0.08] p-3">Attachments stay linked to the issue</div>
            </div>
          </Card>

          <Card>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="text-sm font-black text-slate-700">Title</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-black text-slate-700">Description</label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-slate-700">Category</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="wellbeing">Wellbeing</option>
                    <option value="workload">Workload</option>
                    <option value="discrimination">Discrimination</option>
                    <option value="career">Career</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-black text-slate-700">Severity: {severity}</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    className="mt-4 w-full accent-brand"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                  />
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                Submit anonymously
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              </label>
              <div>
                <label className="text-sm font-black text-slate-700">Attachment</label>
                <input
                  type="file"
                  className="mt-2 block w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                />
                {urls.length > 0 && <p className="mt-2 text-xs font-bold text-brand">{urls.length} file(s) staged</p>}
              </div>
              <Button type="submit" className="w-full py-3">
                Submit issue
              </Button>
            </form>
          </Card>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
