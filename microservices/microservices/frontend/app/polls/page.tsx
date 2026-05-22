"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton } from "@/components/common/UI";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";

type PollResult = {
  option: string;
  count: number;
  percentage: number;
};

type Poll = {
  id: string;
  question: string;
  options: string[];
  target_audience: string;
  expires_at?: string | null;
  has_voted: boolean;
  results: PollResult[];
};

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<Poll[]>("/polls/active");
      setPolls(res.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load polls."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function vote(pollId: string, optionIndex: number) {
    setVotingId(pollId);
    setError(null);
    try {
      await api.post(`/polls/${pollId}/vote`, { option_index: optionIndex });
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not submit your vote."));
    } finally {
      setVotingId(null);
    }
  }

  return (
    <AuthGuard roles={["employee"]}>
      <DashboardShell title="Polls">
        {loading ? (
          <Card>
            <LoadingSkeleton rows={4} />
          </Card>
        ) : (
          <div className="space-y-6">
            {error && (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600" role="alert">
                {error}
              </p>
            )}
            <p className="text-sm leading-6 text-slate-600">
              Pulse surveys from your team leads. You can vote once per poll; after voting you will see anonymized results.
            </p>

            {polls.length === 0 ? (
              <EmptyState icon="board" title="No active polls" text="Check back later—your team leads will post new pulses here." />
            ) : (
              <div className="space-y-6">
                {polls.map((poll) => (
                  <Card key={poll.id} className="border-slate-100">
                    <h3 className="text-lg font-black text-slate-950">{poll.question}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase text-slate-400">{poll.target_audience}</p>

                    {poll.has_voted && poll.results?.length ? (
                      <div className="mt-5 space-y-3">
                        {poll.results.map((result, index) => (
                          <div key={`${poll.id}-r-${index}`} className="space-y-1">
                            <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-800">
                              <span className="min-w-0 truncate">{result.option}</span>
                              <span className="shrink-0 text-slate-500">
                                {result.count} ({result.percentage}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                                style={{ width: `${Math.min(100, result.percentage)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {poll.options.map((option, index) => (
                          <Button
                            key={`${poll.id}-${index}`}
                            variant="outline"
                            type="button"
                            disabled={votingId === poll.id}
                            className="w-full justify-start px-4 py-3 text-left text-sm font-bold"
                            onClick={() => void vote(poll.id, index)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}

                    {poll.expires_at ? (
                      <p className="mt-4 text-xs font-semibold text-slate-400">Closes {new Date(poll.expires_at).toLocaleString()}</p>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}
