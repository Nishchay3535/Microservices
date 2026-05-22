"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton, SeverityPill, Toast } from "@/components/common/UI";
import { Icon } from "@/components/common/Icons";

type Post = {
  id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  severity_score: number;
  reaction_count: number;
  author_label?: string | null;
};

const lanes = [
  { key: "low", label: "Low signal", helper: "Watch and support" },
  { key: "medium", label: "Needs attention", helper: "Growing community concern" },
  { key: "high", label: "High priority", helper: "Escalate with care" },
];

function laneFor(post: Post) {
  if (post.severity_score >= 4) return "high";
  if (post.severity_score >= 2.5) return "medium";
  return "low";
}

function Board() {
  const token = useAuthStore((s) => s.token);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [anon, setAnon] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    const r = await api.get<Post[]>("/public-posts/");
    setPosts(r.data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function create() {
    await api.post("/public-posts/", { title, content, is_anonymous: anon });
    await refresh();
    setTitle("");
    setContent("");
    setToast("Public post created");
    setTimeout(() => setToast(null), 2400);
  }

  async function react(id: string, reaction_type: "support" | "like" | "flag") {
    await api.post(`/public-posts/${id}/react`, { reaction_type });
    await refresh();
    setToast(reaction_type === "support" ? "Support added" : "Reaction saved");
    setTimeout(() => setToast(null), 2200);
  }

  const grouped = useMemo(
    () =>
      lanes.map((lane) => ({
        ...lane,
        posts: posts.filter((post) => laneFor(post) === lane.key),
      })),
    [posts]
  );

  const inner = (
    <div className="space-y-6">
      {toast && <Toast message={toast} />}
      {token && (
        <Card className="bg-gradient-to-br from-slate-950 to-slate-900 text-white">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase text-brand">Community board</p>
              <h2 className="mt-2 text-2xl font-black">Share a visible signal</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Post anonymously when needed. Community reactions help patterns become visible without exposing private identity.
              </p>
            </div>
            <div className="space-y-3">
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-brand"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-brand"
                placeholder="Content"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
                  <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
                  Anonymous
                </label>
                <Button onClick={() => void create()} disabled={!title.trim() || !content.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Card>
          <LoadingSkeleton rows={5} />
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <EmptyState icon="board" title="No public posts yet" text="Community posts and support reactions will appear here in priority lanes." />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {grouped.map((lane) => (
            <section key={lane.key} className="rounded-3xl border border-white/70 bg-white/[0.78] p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase text-slate-500">{lane.label}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{lane.posts.length}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">{lane.helper}</p>
              </div>
              <div className="space-y-3">
                {lane.posts.map((post) => (
                  <article key={post.id} className="group rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-brand">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-950">{post.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{post.content}</p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-500">
                        {post.is_anonymous ? "A" : (post.author_label || "M").slice(0, 1)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <SeverityPill value={Number(post.severity_score.toFixed(1))} />
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {post.is_anonymous ? "Anonymous" : post.author_label || "Member"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-slate-400">{post.reaction_count} reactions</span>
                      {token && (
                        <div className="flex gap-2">
                          <button
                            className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-2 text-xs font-black text-brand transition active:scale-95 hover:bg-brand hover:text-white"
                            onClick={() => void react(post.id, "support")}
                          >
                            <Icon name="heart" className="h-3.5 w-3.5" />
                            Support
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition active:scale-95 hover:bg-slate-950 hover:text-white"
                            onClick={() => void react(post.id, "flag")}
                          >
                            <Icon name="flag" className="h-3.5 w-3.5" />
                            Flag
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {lane.posts.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
                    Empty lane
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );

  if (token) {
    return (
      <AuthGuard>
        <DashboardShell title="Public board">{inner}</DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Card className="mb-6 bg-slate-950 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-brand">Open visibility</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">Public board</h1>
              <p className="mt-2 text-sm text-white/60">Visible issues and community support signals.</p>
            </div>
            <Link href="/login">
              <Button>Sign in to post</Button>
            </Link>
          </div>
        </Card>
        {inner}
      </div>
    </div>
  );
}

export default function PublicPage() {
  return <Board />;
}
