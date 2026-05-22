"use client";

import { Card } from "@/components/common/UI";
import type { SupportNetworkWidgetProps } from "@/types/profile";

const getInitials = (name?: string, id?: string) => {
  const normalized = (name || id || "User").trim();
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return "US";
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
};

export function SupportNetworkWidget({ supporters }: SupportNetworkWidgetProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Support network</h2>
          <p className="text-sm text-slate-500">People who reacted to your public posts and helped you grow.</p>
        </div>

        <div className="support-network-enter flex items-center gap-3">
          <div className="flex -space-x-3">
            {supporters.slice(0, 5).map((supporter, index) => {
              const displayName = supporter.full_name?.trim() || supporter.id || "Supporter";
              return (
                <div key={supporter.id} className="relative">
                  <div className="h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-slate-900 text-sm font-black text-white shadow-lg" style={{ marginLeft: index === 0 ? 0 : -16 }}>
                    {supporter.avatar_url ? (
                      <img src={supporter.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">{getInitials(displayName, supporter.id)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">{supporters.length} people in your support network</p>
            <p className="text-sm text-slate-500">A growing circle of allies and champions.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .support-network-enter {
          animation: support-network-in 0.8s ease-out forwards;
        }

        @keyframes support-network-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </Card>
  );
}
