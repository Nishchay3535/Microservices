"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, LoadingSkeleton, Toast } from "@/components/common/UI";

type Row = { id: string; email: string; full_name: string; role: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    const r = await api.get<Row[]>("/admin/users");
    setUsers(r.data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function setRole(id: string, role: string) {
    await api.put(`/admin/users/${id}/role`, { role });
    await refresh();
    setToast(`Role changed to ${role}`);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <AuthGuard roles={["admin"]}>
      <DashboardShell title="User management">
        {toast && <Toast message={toast} />}
        <Card>
          {loading && <LoadingSkeleton rows={5} />}
          {!loading && users.length === 0 && <EmptyState icon="users" title="No users found" text="Registered accounts will appear here for role management." />}
          {!loading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-slate-400">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="rounded-3xl bg-slate-50 shadow-sm">
                      <td className="rounded-l-3xl px-4 py-4 font-black text-slate-950">{user.full_name}</td>
                      <td className="px-4 py-4 font-semibold text-slate-500">{user.email}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-black capitalize text-brand">{user.role}</span>
                      </td>
                      <td className="rounded-r-3xl px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {["employee", "authority", "mentor", "admin"].map((role) => (
                            <Button key={role} variant="outline" className="px-3 py-2 text-xs" onClick={() => void setRole(user.id, role)}>
                              {role}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </DashboardShell>
    </AuthGuard>
  );
}
