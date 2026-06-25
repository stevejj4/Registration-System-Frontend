import React, { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  resetUserPassword,
  updateUserRole,
  SystemUser,
} from "@/api/adminApi";
import { Button } from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CreateUserModal from "@/features/admin/CreateUserModal";
import EditUserModal from "@/features/admin/EditUserModal";
import ResetPasswordModal from "@/features/admin/ResetPasswordModal";
import { UpdateUserRequestDTO } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { isCurrentUserAccount } from "@/utils/userAccount";
import { RefreshCw, Search, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 8;
const ASSIGNABLE_ROLES: UserRole[] = ["FACILITATOR", "COORDINATOR"];

export default function UserList() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      setUsers(res || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const userKpis = useMemo(() => {
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const coordinators = users.filter((u) => u.role === "COORDINATOR").length;
    const facilitators = users.filter((u) => u.role === "FACILITATOR").length;

    return [
      {
        label: "Total Users",
        value: admins + coordinators + facilitators,
        icon: UsersRound,
        accent: "bg-sky-500",
      },
      {
        label: "Facilitators",
        value: facilitators,
        icon: UserCog,
        accent: "bg-emerald-500",
      },
      {
        label: "Coordinators",
        value: coordinators,
        icon: UserCog,
        accent: "bg-violet-500",
      },
      {
        label: "Admins",
        value: admins,
        icon: ShieldCheck,
        accent: "bg-rose-500",
      },
    ];
  }, [users]);

  const {
    page,
    setPage,
    paginatedItems: paginatedUsers,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
  } = usePagination(filteredUsers, PAGE_SIZE, [search]);

  const existingEmails = useMemo(
    () => users.map((u) => u.email),
    [users]
  );

  const handleCreate = async (data: Parameters<typeof createUser>[0]) => {
    setError(null);
    try {
      const result = await createUser(data);
      setUsers((prev) => [...prev, result.user]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Create failed";
      setError(message);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (isCurrentUserAccount(currentUser, deleteTarget)) {
      setError("You cannot delete your own account.");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = async (id: string, data: UpdateUserRequestDTO) => {
    setError(null);
    try {
      const updated = await updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      throw err;
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetTarget) return;
    await resetUserPassword(resetTarget.id, newPassword);
  };

  const handleChangeRole = async (id: string, newRole: UserRole) => {
    const target = users.find((u) => u.id === id);
    if (target && isCurrentUserAccount(currentUser, target)) {
      setError("You cannot change your own role.");
      return;
    }

    setError(null);
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role update failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">System Users</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts, roles, passwords, and assigned work areas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {userKpis.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat().format(card.value)}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${card.accent}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-gray-600 mb-2">Loading...</p>}
      {error && (
        <p className="text-red-600 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or email..."
              aria-label="Search users"
              className="w-full rounded-full border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">
                User ID
              </th>
              <th className="px-4 py-3 font-semibold">
                Name
              </th>
              <th className="px-4 py-3 font-semibold">
                Email
              </th>
              <th className="px-4 py-3 font-semibold">
                Role
              </th>
              <th className="px-4 py-3 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const isSelf = isCurrentUserAccount(currentUser, u);
                return (
                  <tr
                    key={u.id}
                    className={`border-t ${isSelf ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                      {u.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{u.fullName}</span>
                      {isSelf && (
                        <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        title={
                          isSelf
                            ? "You cannot change your own role"
                            : undefined
                        }
                        onChange={(e) =>
                          handleChangeRole(u.id, e.target.value as UserRole)
                        }
                        className="border rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                        {u.role === "ADMIN" && (
                          <option value="ADMIN">ADMIN</option>
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditTarget(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "You cannot delete your own account"
                              : undefined
                          }
                          onClick={() => setDeleteTarget(u)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "Reset your password via account settings"
                              : undefined
                          }
                          onClick={() => setResetTarget(u)}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={setPage}
        className="mt-4 rounded-md border border-gray-200 bg-white"
      />

      <CreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        existingEmails={existingEmails}
      />

      <EditUserModal
        isOpen={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        existingEmails={existingEmails}
      />

      <ResetPasswordModal
        isOpen={!!resetTarget}
        userName={resetTarget?.fullName ?? ""}
        onClose={() => setResetTarget(null)}
        onSubmit={handleResetPassword}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete user"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete ${deleteTarget.fullName} (${deleteTarget.email})? This action cannot be undone.`
            : ""
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleting) void handleConfirmDelete();
        }}
      />
    </div>
  );
}
